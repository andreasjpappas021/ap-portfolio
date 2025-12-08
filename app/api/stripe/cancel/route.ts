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

    // Get the user's paid purchases
    const { data: purchases } = await supabase
      .from('session_purchases')
      .select('id, stripe_subscription_id, stripe_customer_id, subscription_status')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    let subscriptionId: string | undefined
    let purchase = purchases?.find(
      (p) => 
        p.subscription_status !== 'cancelled' &&
        p.stripe_subscription_id
    )

    // If we found a purchase with subscription_id, use it
    if (purchase?.stripe_subscription_id) {
      subscriptionId = purchase.stripe_subscription_id
    } else {
      // Try to find a purchase with customer_id and check Stripe for active subscriptions
      purchase = purchases?.find(
        (p) => 
          p.subscription_status !== 'cancelled' &&
          p.stripe_customer_id
      )

      if (purchase?.stripe_customer_id) {
        try {
          // List active subscriptions for this customer from Stripe
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
    }

    // If still no subscription found, check all purchases for any customer_id and query Stripe
    if (!subscriptionId && purchases && purchases.length > 0) {
      // Get all unique customer IDs
      const customerIds = purchases
        .map(p => p.stripe_customer_id)
        .filter((id): id is string => !!id)
      
      for (const customerId of customerIds) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1,
          })
          
          if (subscriptions.data.length > 0) {
            subscriptionId = subscriptions.data[0].id
            
            // Find the purchase for this customer and update it
            purchase = purchases.find(p => p.stripe_customer_id === customerId)
            if (purchase) {
              await supabase
                .from('session_purchases')
                .update({ stripe_subscription_id: subscriptionId })
                .eq('id', purchase.id)
            }
            break
          }
        } catch (error) {
          console.error('Error fetching subscription from Stripe for customer:', customerId, error)
        }
      }
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found. You may have already cancelled your subscription, or it may have expired.' },
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

