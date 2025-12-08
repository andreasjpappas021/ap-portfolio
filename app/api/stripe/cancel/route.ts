import { requireAuth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Get the user's active subscription
    // Include subscriptions with null subscription_status (treat as active if they have a subscription_id or customer_id)
    const { data: purchases } = await supabase
      .from('session_purchases')
      .select('id, stripe_subscription_id, stripe_customer_id, subscription_status')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    // Find the first non-cancelled subscription that has either subscription_id or customer_id
    const purchase = purchases?.find(
      (p) => 
        p.subscription_status !== 'cancelled' &&
        (p.stripe_subscription_id || p.stripe_customer_id)
    )

    // If we have a customer_id but no subscription_id, try to find the subscription from Stripe
    let subscriptionId = purchase?.stripe_subscription_id
    
    if (!subscriptionId && purchase?.stripe_customer_id) {
      try {
        // List active subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: purchase.stripe_customer_id,
          status: 'active',
          limit: 1,
        })
        
        if (subscriptions.data.length > 0) {
          subscriptionId = subscriptions.data[0].id
          
          // Update the purchase record with the subscription_id we found
          await supabase
            .from('session_purchases')
            .update({ stripe_subscription_id: subscriptionId })
            .eq('id', purchase.id)
        }
      } catch (error) {
        console.error('Error fetching subscription from Stripe:', error)
      }
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.cancel(subscriptionId)

    // Update the database immediately (webhook will also handle this, but this provides immediate feedback)
    await supabase
      .from('session_purchases')
      .update({
        subscription_status: 'cancelled',
        stripe_subscription_id: subscriptionId, // Ensure it's set
      })
      .eq('id', purchase.id)

    // Fire user_churned event for Customer.io
    try {
      await trackEvent(user.id, 'user_churned', {
        subscription_id: subscriptionId,
        cancelled_at: new Date().toISOString(),
        cancelled_immediately: true,
      })
      console.log('user_churned event tracked after subscription cancellation')
    } catch (err) {
      console.error('Error tracking user_churned:', err)
    }

    // Log audit event
    try {
      await logAuditEvent(user.id, 'user_churned', {
        subscription_id: subscriptionId,
        cancelled_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Error logging user_churned audit:', err)
    }

    return NextResponse.json({ 
      success: true,
      subscription_id: subscription.id,
      cancelled_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

