import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent, sendTransactionalEmail } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL('/dashboard/purchase', request.url))
  }

  try {
    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session.metadata?.userId) {
      console.error('No userId in session metadata')
      return NextResponse.redirect(new URL('/dashboard/purchase', request.url))
    }

    const userId = session.metadata.userId

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

    // Set a temporary cookie to allow dashboard access
    // This cookie will be checked by middleware to bypass auth temporarily
    const response = NextResponse.redirect(new URL(`/dashboard?stripe_session=${sessionId}`, request.url))
    
    // Set temporary access cookie (expires in 5 minutes)
    response.cookies.set('stripe_temp_access', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    })
    
    return response
  } catch (error) {
    console.error('Error processing Stripe callback:', error)
    // Redirect to purchase page on error
    return NextResponse.redirect(new URL('/dashboard/purchase', request.url))
  }
}
