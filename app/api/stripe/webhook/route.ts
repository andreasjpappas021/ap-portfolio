import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent, sendTransactionalEmail } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('Processing checkout.session.completed for session:', session.id)

    // Update session purchase status to paid
    const { data: purchase, error: updateError } = await supabase
      .from('session_purchases')
      .update({ status: 'paid' })
      .eq('stripe_session_id', session.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating purchase:', updateError)
      // Don't return error - we still want to process the event
    } else {
      console.log('Purchase updated successfully:', purchase)
    }

    const userId = session.metadata?.userId || purchase?.user_id

    if (!userId) {
      console.error('No userId found in session metadata or purchase:', {
        metadata: session.metadata,
        purchase: purchase,
      })
    } else {
      console.log('Processing events for userId:', userId)

      // Retrieve line items to get product name
      let productName = 'Consulting Session' // Default fallback
      let price = session.amount_total || 0
      
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
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
        // Use default product name if retrieval fails
      }

      // Track events
      try {
        await trackEvent(userId, 'payment_completed', {
          session_id: session.id,
          amount: session.amount_total,
          currency: session.currency,
        })
        console.log('payment_completed event tracked')
      } catch (err) {
        console.error('Error tracking payment_completed:', err)
      }

      try {
        await trackEvent(userId, 'session_purchased', {
          session_id: session.id,
          amount: session.amount_total,
        })
        console.log('session_purchased event tracked')
      } catch (err) {
        console.error('Error tracking session_purchased:', err)
      }

      try {
        await trackEvent(userId, 'order_completed', {
          session_id: session.id,
          product_name: productName,
          price: price,
          price_formatted: `$${(price / 100).toFixed(2)}`,
          currency: session.currency || 'usd',
        })
        console.log('order_completed event tracked')
      } catch (err) {
        console.error('Error tracking order_completed:', err)
      }

      // Log to audit table
      try {
        await logAuditEvent(userId, 'payment_completed', {
          session_id: session.id,
          amount: session.amount_total,
        })
        await logAuditEvent(userId, 'session_purchased', {
          session_id: session.id,
        })
        await logAuditEvent(userId, 'order_completed', {
          session_id: session.id,
          product_name: productName,
          price: price,
        })
        console.log('Audit events logged')
      } catch (err) {
        console.error('Error logging audit events:', err)
      }

      // Send transactional email
      try {
        await sendTransactionalEmail(
          userId,
          'payment_success', // This should be your actual transactional message ID in Customer.io
          {
            session_id: session.id,
            amount: (session.amount_total || 0) / 100,
          }
        )
        console.log('Transactional email sent')
      } catch (err) {
        console.error('Error sending transactional email:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}

