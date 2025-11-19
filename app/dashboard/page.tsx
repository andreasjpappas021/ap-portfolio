import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { trackEvent } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import SessionPrepForm from '@/components/SessionPrepForm'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type DashboardPageProps = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireAuth()
  const supabase = await createClient()
  const params = await searchParams
  const sessionId = params?.session_id

  // If we have a session_id from Stripe redirect, verify payment and update status
  if (sessionId) {
    try {
      // Verify the session with Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      // Auto-approve if:
      // 1. Payment status is 'paid' OR
      // 2. Checkout session status is 'complete' (successful checkout) OR
      // 3. In test mode (livemode === false) - auto-approve all test payments
      const isSuccessfulCheckout = 
        session.payment_status === 'paid' || 
        session.status === 'complete' ||
        (session.payment_status === 'paid' && session.status === 'complete')
      
      const shouldApprove = 
        (isSuccessfulCheckout && session.metadata?.userId === user.id) ||
        (session.livemode === false && session.metadata?.userId === user.id)
      
      if (shouldApprove) {
        // Update purchase status if not already paid (fallback if webhook didn't process)
        const adminSupabase = createAdminClient()
        const { data: updatedPurchase } = await adminSupabase
          .from('session_purchases')
          .update({ status: 'paid' })
          .eq('stripe_session_id', sessionId)
          .eq('status', 'pending')
          .select()
          .single()

        // If we successfully updated a pending purchase, track order_completed event
        if (updatedPurchase) {
          try {
            // Get product details for tracking
            let productName = 'Consulting Session'
            let price = session.amount_total || 0
            
            try {
              const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
                limit: 1,
              })
              if (lineItems.data.length > 0 && lineItems.data[0].description) {
                productName = lineItems.data[0].description
              } else if (lineItems.data.length > 0 && lineItems.data[0].price?.product) {
                const product = await stripe.products.retrieve(
                  typeof lineItems.data[0].price.product === 'string'
                    ? lineItems.data[0].price.product
                    : lineItems.data[0].price.product.id
                )
                productName = product.name
              }
            } catch (err) {
              console.error('Error retrieving product details:', err)
            }

            // Track order_completed event
            await trackEvent(user.id, 'order_completed', {
              session_id: sessionId,
              product_name: productName,
              price: price,
              price_formatted: `$${(price / 100).toFixed(2)}`,
              currency: session.currency || 'usd',
            })
            await logAuditEvent(user.id, 'order_completed', {
              session_id: sessionId,
              product_name: productName,
              price: price,
            })
            console.log('order_completed event tracked (fallback)')
          } catch (err) {
            console.error('Error tracking order_completed event:', err)
          }
        }
      }
    } catch (error) {
      console.error('Error verifying payment session:', error)
      // Continue anyway - we'll check database status below
    }
  }

  // Get user's session purchases
  const { data: purchases } = await supabase
    .from('session_purchases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const hasPaidSession = purchases?.some((p) => p.status === 'paid') || false

  // Track dashboard view event
  await trackEvent(user.id, 'dashboard_viewed', {
    has_paid_session: hasPaidSession,
  })
  await logAuditEvent(user.id, 'dashboard_viewed', {
    has_paid_session: hasPaidSession,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-300">
            Welcome back, {user.profile?.name || user.email}!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-slate-400 text-sm">Email:</span>
                <p className="text-white">{user.email}</p>
              </div>
              {user.profile?.name && (
                <div>
                  <span className="text-slate-400 text-sm">Name:</span>
                  <p className="text-white">{user.profile.name}</p>
                </div>
              )}
              {user.profile?.job && (
                <div>
                  <span className="text-slate-400 text-sm">Job:</span>
                  <p className="text-white">{user.profile.job}</p>
                </div>
              )}
              {user.profile?.company && (
                <div>
                  <span className="text-slate-400 text-sm">Company:</span>
                  <p className="text-white">{user.profile.company}</p>
                </div>
              )}
              <div className="pt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/settings">Edit Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Status Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Session Status</CardTitle>
              <CardDescription className="text-slate-400">
                Your coaching session access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasPaidSession ? (
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-semibold">Session Unlocked</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-400">
                  <Clock className="w-6 h-6" />
                  <span>No active session</span>
                </div>
              )}

              {purchases && purchases.length > 0 && (
                <div className="space-y-2 pt-4">
                  <p className="text-slate-400 text-sm font-semibold">
                    Purchase History:
                  </p>
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-2 bg-slate-700/50 rounded"
                    >
                      <span className="text-slate-300 text-sm">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-sm ${
                          purchase.status === 'paid'
                            ? 'text-green-400'
                            : purchase.status === 'pending'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4">
                {hasPaidSession ? (
                  <Button asChild className="w-full">
                    <Link href="/dashboard/schedule">Schedule Session</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/dashboard/purchase">Purchase Session</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Prep Section - Only show if paid AND scheduled */}
        {(() => {
          if (!hasPaidSession) return null
          // Check if user has scheduled (has scheduled_at timestamp)
          const hasScheduled = purchases?.some((p) => p.scheduled_at !== null) || false
          if (!hasScheduled) return null
          return (
            <div className="mt-8">
              <SessionPrepForm />
            </div>
          )
        })()}
      </div>
    </div>
  )
}

