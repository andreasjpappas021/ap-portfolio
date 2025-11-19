import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import CalendlyBadge from '@/components/CalendlyBadge'
import MarkScheduledButton from '@/components/MarkScheduledButton'
import { trackEvent } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type SchedulePageProps = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const user = await requireAuth()
  const supabase = await createClient()
  const params = await searchParams
  const sessionId = params?.session_id

  // If we have a session_id from Stripe redirect, verify payment and update status
  if (sessionId) {
    try {
      // Verify the session with Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      if (session.payment_status === 'paid' && session.metadata?.userId === user.id) {
        // Update purchase status if not already paid (fallback if webhook didn't process)
        const adminSupabase = createAdminClient()
        await adminSupabase
          .from('session_purchases')
          .update({ status: 'paid' })
          .eq('stripe_session_id', sessionId)
          .eq('status', 'pending')
      }
    } catch (error) {
      console.error('Error verifying payment session:', error)
      // Continue anyway - we'll check database status below
    }
  }

  // Check if user has a paid session
  const { data: purchases } = await supabase
    .from('session_purchases')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'paid')

  const hasPaidSession = purchases && purchases.length > 0

  // Track session booking opened event
  await trackEvent(user.id, 'session_booking_opened', {
    has_paid_session: hasPaidSession,
  })
  await logAuditEvent(user.id, 'session_booking_opened', {
    has_paid_session: hasPaidSession,
  })

  // Redirect if no paid session
  if (!hasPaidSession) {
    redirect('/dashboard/purchase')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Schedule Your Session
          </h1>
          <p className="text-slate-300">
            Choose a time that works for you
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Book Your Coaching Session</CardTitle>
            <CardDescription className="text-slate-400">
              Select a 30-minute time slot below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendlyBadge />
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <MarkScheduledButton purchaseId={purchases?.[0]?.id} />
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

