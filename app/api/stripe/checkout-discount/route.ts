import { requireAuth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/app-url'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Get coupon code from request body or use default from env
    let couponId: string | undefined
    try {
      const body = await request.json()
      couponId = body.couponId || body.coupon
    } catch {
      // If no body, use default from env
    }

    // Use default discount coupon from env if not provided
    if (!couponId) {
      couponId = process.env.STRIPE_DISCOUNT_COUPON_ID
    }

    if (!couponId) {
      return NextResponse.json(
        { error: 'No discount coupon configured' },
        { status: 400 }
      )
    }

    // Check if user has an existing active subscription
    const { data: purchases } = await supabase
      .from('session_purchases')
      .select('id, stripe_subscription_id, stripe_customer_id, subscription_status')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    let existingPurchase = purchases?.find(
      (p) => 
        (p.subscription_status === null || p.subscription_status !== 'cancelled') &&
        p.stripe_subscription_id
    )

    // If we have a customer_id but no subscription_id, try to find the subscription from Stripe
    if (!existingPurchase?.stripe_subscription_id) {
      const purchaseWithCustomer = purchases?.find(
        (p) => 
          (p.subscription_status === null || p.subscription_status !== 'cancelled') &&
          p.stripe_customer_id
      )

      if (purchaseWithCustomer?.stripe_customer_id) {
        try {
          // List active subscriptions for this customer
          const subscriptions = await stripe.subscriptions.list({
            customer: purchaseWithCustomer.stripe_customer_id,
            status: 'active',
            limit: 1,
          })
          
          if (subscriptions.data.length > 0) {
            const subscriptionId = subscriptions.data[0].id
            
            // Update the purchase record with the subscription_id we found
            await supabase
              .from('session_purchases')
              .update({ stripe_subscription_id: subscriptionId })
              .eq('id', purchaseWithCustomer.id)
            
            existingPurchase = {
              ...purchaseWithCustomer,
              stripe_subscription_id: subscriptionId,
            }
          }
        } catch (error) {
          console.error('[checkout-discount] Error fetching subscription from Stripe:', error)
        }
      }
    }

    // If user has an existing subscription, apply discount to it
    if (existingPurchase?.stripe_subscription_id) {
      try {
        // First verify the subscription is active in Stripe
        const subscriptionCheck = await stripe.subscriptions.retrieve(existingPurchase.stripe_subscription_id)
        
        if (subscriptionCheck.status !== 'active' && subscriptionCheck.status !== 'trialing') {
          // Fall through to create new checkout
        } else {
          const subscription = await stripe.subscriptions.update(
            existingPurchase.stripe_subscription_id,
            {
              coupon: couponId,
            }
          )

          // Return success - no redirect to Stripe Checkout needed
          const response = NextResponse.json({ 
            success: true,
            message: 'Discount applied successfully. It will take effect on your next billing period.',
            subscription_id: subscription.id,
            action: 'applied_to_existing'
          })
          response.headers.set('X-Discount-Action', 'applied-to-existing')
          return response
        }
      } catch (error: any) {
        console.error('[checkout-discount] Error applying discount to subscription:', error)
        
        // Check if it's a coupon-related error
        if (error.code === 'resource_missing' || error.message?.includes('coupon')) {
          return NextResponse.json(
            { error: 'Invalid discount coupon. Please contact support.' },
            { status: 400 }
          )
        }
        
        // If subscription not found or other error, fall through to create new checkout
      }
    }

    // If no existing subscription, create a new checkout session with the discount applied
    const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { error: 'STRIPE_SUBSCRIPTION_PRICE_ID is not configured' },
        { status: 500 }
      )
    }

    const appUrl = getAppUrl(request)

    // Create Stripe Checkout session with discount coupon
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      discounts: [{ coupon: couponId }],
      success_url: `${appUrl}/api/stripe/callback?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/purchase`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        discount_source: 'iam',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    })

    // Create a pending session purchase record
    await supabase.from('session_purchases').insert({
      user_id: user.id,
      stripe_session_id: session.id,
      status: 'pending',
    })

    // Return the checkout URL for redirect
    const response = NextResponse.json({ 
      url: session.url,
      success: true,
      message: 'Redirecting to checkout with discount applied',
      action: 'new_checkout'
    })
    response.headers.set('X-Discount-Action', 'new-checkout')
    return response
  } catch (error: any) {
    console.error('Discount checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply discount' },
      { status: 500 }
    )
  }
}

