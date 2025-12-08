import { requireAuth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    if (!priceId) {
      throw new Error('STRIPE_SUBSCRIPTION_PRICE_ID is not configured')
    }

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

    // Check if user has an existing active subscription
    const { data: purchases } = await supabase
      .from('session_purchases')
      .select('id, stripe_subscription_id, stripe_customer_id, subscription_status')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    const existingPurchase = purchases?.find(
      (p) => 
        p.subscription_status !== 'cancelled' &&
        (p.stripe_subscription_id || p.stripe_customer_id)
    )

    // If user has an existing subscription, cancel it first (at period end)
    // This ensures they keep access until the end of their billing period
    // and the new subscription with discount will start after
    if (existingPurchase?.stripe_subscription_id) {
      try {
        // Cancel the existing subscription at period end
        await stripe.subscriptions.update(existingPurchase.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
        
        // Update database to reflect cancellation scheduled
        await supabase
          .from('session_purchases')
          .update({
            subscription_status: 'cancelled', // Mark as cancelled (will take effect at period end)
          })
          .eq('id', existingPurchase.id)
      } catch (error) {
        console.error('Error cancelling existing subscription:', error)
        // Continue anyway - we'll create the new subscription
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Create Stripe Checkout session for subscription with discount
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/api/stripe/callback?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        discount_applied: couponId ? 'true' : 'false',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    }

    // Add discount if coupon is provided
    if (couponId) {
      sessionConfig.discounts = [
        {
          coupon: couponId,
        },
      ]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Create a pending session purchase record
    await supabase.from('session_purchases').insert({
      user_id: user.id,
      stripe_session_id: session.id,
      status: 'pending',
    })

    // Return the checkout URL for direct redirect
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Discount checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

