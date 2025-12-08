import { requireAuth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/app-url'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Check if user already has an active subscription
    const { data: purchases } = await supabase
      .from('session_purchases')
      .select('id, stripe_subscription_id, stripe_customer_id, subscription_status')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    // Check if user has an active (non-cancelled) subscription
    const hasActiveSubscription = purchases?.some(
      (p) => 
        p.subscription_status !== 'cancelled' &&
        (p.stripe_subscription_id || p.stripe_customer_id)
    )

    if (hasActiveSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please cancel your current subscription before creating a new one.' },
        { status: 400 }
      )
    }

    const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    if (!priceId) {
      throw new Error('STRIPE_SUBSCRIPTION_PRICE_ID is not configured')
    }

    const appUrl = getAppUrl(request)

    // Create Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/api/stripe/callback?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/purchase`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
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

    // Return the checkout URL for direct redirect
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

