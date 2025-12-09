import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent, sendTransactionalEmail } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  console.log('[Webhook] ⚡ Stripe webhook received!')
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    console.error('[Webhook] ❌ No signature found')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  console.log('[Webhook] ✅ Signature found, verifying...')

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
  console.log('[Webhook] Event type:', event.type)
  
  // Handle subscription created
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    console.log('[Webhook] ✅ Processing customer.subscription.created:', subscription.id)

    if (userId) {
      // Update the session purchase with subscription details
      const { error: updateError } = await supabase
        .from('session_purchases')
        .update({
          status: 'paid',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          subscription_status: 'active',
        })
        .eq('user_id', userId)
        .eq('status', 'pending')

      if (updateError) {
        console.error('Error updating purchase with subscription:', updateError)
      }

      // Fetch user profile to get name
      const { data: userProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single()
      const userName = userProfile?.name || ''

      // Track subscription_started event for Customer.io
      try {
        await trackEvent(userId, 'subscription_started', {
          name: userName,
          subscription_id: subscription.id,
          plan: 'monthly',
          amount: 1500, // $15.00
          currency: 'usd',
        })
        console.log('subscription_started event tracked')
      } catch (err) {
        console.error('Error tracking subscription_started:', err)
      }

      // Log audit event
      try {
        await logAuditEvent(userId, 'subscription_started', {
          name: userName,
          subscription_id: subscription.id,
        })
      } catch (err) {
        console.error('Error logging subscription_started audit:', err)
      }
    }
  }

  // Handle subscription deleted (cancelled)
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    console.log('[Webhook] ✅ Processing customer.subscription.deleted:', subscription.id)

    // Find the purchase by subscription ID
    const { data: purchase } = await supabase
      .from('session_purchases')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    const targetUserId = userId || purchase?.user_id

    if (targetUserId) {
      // Update subscription status to cancelled
      const { error: updateError } = await supabase
        .from('session_purchases')
        .update({
          subscription_status: 'cancelled',
        })
        .eq('stripe_subscription_id', subscription.id)

      if (updateError) {
        console.error('Error updating subscription status:', updateError)
      }

      // Fetch user profile to get name
      const { data: userProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', targetUserId)
        .single()
      const userName = userProfile?.name || ''

      // Track subscription_cancelled event for Customer.io campaigns
      try {
        await trackEvent(targetUserId, 'subscription_cancelled', {
          name: userName,
          subscription_id: subscription.id,
          cancelled_at: new Date().toISOString(),
        })
        console.log('subscription_cancelled event tracked')
      } catch (err) {
        console.error('Error tracking subscription_cancelled:', err)
      }

      // Track user_churned event for Customer.io flows
      try {
        await trackEvent(targetUserId, 'user_churned', {
          name: userName,
          subscription_id: subscription.id,
          cancelled_at: new Date().toISOString(),
          cancelled_via: 'stripe_webhook',
        })
        console.log('user_churned event tracked')
      } catch (err) {
        console.error('Error tracking user_churned:', err)
      }

      // Log audit event
      try {
        await logAuditEvent(targetUserId, 'subscription_cancelled', {
          name: userName,
          subscription_id: subscription.id,
        })
        await logAuditEvent(targetUserId, 'user_churned', {
          name: userName,
          subscription_id: subscription.id,
          cancelled_at: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Error logging audit events:', err)
      }
    }
  }

  // Handle checkout session completed (for subscription or one-time)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('[Webhook] ✅ Processing checkout.session.completed for session:', session.id)

    // For subscription mode, the subscription webhook handles the main logic
    // This handles any additional tracking and the pending status update
    // Also extract subscription_id if this is a subscription checkout
    const updateData: {
      status: string
      stripe_customer_id: string
      stripe_subscription_id?: string
      subscription_status?: string
    } = {
      status: 'paid',
      stripe_customer_id: session.customer as string,
    }

    // If this is a subscription checkout, get the subscription ID
    if (session.mode === 'subscription' && session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id
      updateData.stripe_subscription_id = subscriptionId
      updateData.subscription_status = 'active'
    }

    const { data: purchase, error: updateError } = await supabase
      .from('session_purchases')
      .update(updateData)
      .eq('stripe_session_id', session.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating purchase:', updateError)
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

      // Fetch user profile to get name
      const { data: userProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single()
      const userName = userProfile?.name || ''

      // Retrieve line items to get product name
      let productName = 'Coaching Access' // Default for subscription
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
      }

      // Track events
      try {
        await trackEvent(userId, 'payment_completed', {
          name: userName,
          session_id: session.id,
          amount: session.amount_total,
          currency: session.currency,
          mode: session.mode, // 'subscription' or 'payment'
        })
        console.log('payment_completed event tracked')
      } catch (err) {
        console.error('Error tracking payment_completed:', err)
      }

      try {
        await trackEvent(userId, 'order_completed', {
          name: userName,
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
          name: userName,
          session_id: session.id,
          amount: session.amount_total,
        })
        await logAuditEvent(userId, 'order_completed', {
          name: userName,
          session_id: session.id,
          product_name: productName,
          price: price,
        })
        console.log('Audit events logged')
      } catch (err) {
        console.error('Error logging audit events:', err)
      }

      // Send transactional email
      console.log('[Webhook] Attempting to send transactional email for userId:', userId)
      
      // Log the exact data being sent
      const emailData = {
        session_id: session.id,
        product_name: productName,
        price: price,
        price_formatted: `$${(price / 100).toFixed(2)}`,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
      }
      console.log('[Webhook] 📧 Email data being sent:', JSON.stringify(emailData, null, 2))
      
      try {
        await sendTransactionalEmail(
          userId,
          'order_completed',
          emailData
        )
        console.log('[Webhook] ✅ Transactional email function completed')
      } catch (err) {
        console.error('[Webhook] ❌ Error sending transactional email:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}

