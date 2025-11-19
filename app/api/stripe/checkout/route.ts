import { requireAuth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Consulting Session',
              description: '30-minute coaching session',
            },
            unit_amount: 9900, // $99.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/dashboard/schedule?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/dashboard/purchase`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
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

