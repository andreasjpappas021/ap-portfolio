import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { trackEvent, sendTransactionalEmail } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { getAppUrl } from '@/lib/app-url'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')
  const appUrl = getAppUrl(request)

  if (!sessionId) {
    return NextResponse.redirect(new URL('/dashboard/purchase', appUrl))
  }

  try {
    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session.metadata?.userId) {
      console.error('No userId in session metadata')
      return NextResponse.redirect(new URL('/dashboard/purchase', appUrl))
    }

    const userId = session.metadata.userId

    // Check if user still has a valid Supabase session
    // This helps preserve authentication after Stripe redirect
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    // If user session exists and matches the Stripe session userId, they're still logged in
    const isAuthenticated = currentUser && currentUser.id === userId

    // Check if payment should be approved
    // Auto-approve if:
    // 1. Payment status is 'paid' OR
    // 2. Checkout session status is 'complete' (successful checkout) OR
    // 3. In test mode (livemode === false) - auto-approve all test payments
    const isSuccessfulCheckout = 
      session.payment_status === 'paid' || 
      session.status === 'complete'
    
    const shouldApprove = 
      isSuccessfulCheckout ||
      session.livemode === false // Auto-approve test mode payments

    if (shouldApprove) {
      // Update purchase status if not already paid
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
          await trackEvent(userId, 'order_completed', {
            session_id: sessionId,
            product_name: productName,
            price: price,
            price_formatted: `$${(price / 100).toFixed(2)}`,
            currency: session.currency || 'usd',
          })
          await logAuditEvent(userId, 'order_completed', {
            session_id: sessionId,
            product_name: productName,
            price: price,
          })
          console.log('order_completed event tracked (callback)')

          // Send transactional email
          try {
            console.log('[Callback] Attempting to send transactional email for userId:', userId)
            await sendTransactionalEmail(
              userId,
              'order_completed',
              {
                session_id: sessionId,
                product_name: productName,
                price: price,
                price_formatted: `$${(price / 100).toFixed(2)}`,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency || 'usd',
              }
            )
            console.log('[Callback] ✅ Transactional email function completed')
          } catch (err) {
            console.error('[Callback] ❌ Error sending transactional email:', err)
          }
        } catch (err) {
          console.error('Error tracking order_completed event:', err)
        }
      }
    }

    // If user is still authenticated, redirect directly to dashboard
    // Otherwise, set temporary cookie and redirect (dashboard will handle login flow)
    // Use proper app URL instead of request.url to avoid Vercel preview URL issues
    const dashboardUrl = new URL(`/dashboard?stripe_session=${sessionId}`, appUrl)
    const response = NextResponse.redirect(dashboardUrl)
    
    // Always set temporary access cookie as a fallback (expires in 5 minutes)
    // This allows dashboard to verify the session even if Supabase session is lost
    response.cookies.set('stripe_temp_access', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    })
    
    // If user is authenticated, they should stay logged in
    // If not, dashboard will redirect to login with email pre-filled
    return response
  } catch (error) {
    console.error('Error processing Stripe callback:', error)
    // Redirect to purchase page on error - use proper app URL
    return NextResponse.redirect(new URL('/dashboard/purchase', appUrl))
  }
}
