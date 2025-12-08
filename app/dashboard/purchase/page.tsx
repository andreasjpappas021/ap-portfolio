'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { track } from '@/lib/customerio'

export default function PurchasePage() {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    // Track clicks continue to payment event (client-side)
    track('clicks_continue_to_payment', {
      page: '/dashboard/purchase',
    })

    // Also track server-side if user is authenticated
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Track server-side for audit logging
        await fetch('/api/customerio/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            eventName: 'clicks_continue_to_payment',
            data: {
              page: '/dashboard/purchase',
            },
          }),
        }).catch(err => {
          console.error('Error tracking clicks_continue_to_payment server-side:', err)
          // Don't block checkout if tracking fails
        })
      }
    } catch (err) {
      console.error('Error getting user for tracking:', err)
      // Continue with checkout even if tracking fails
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      if (!url) {
        throw new Error('No checkout URL received')
      }

      // Redirect directly to Stripe Checkout
      window.location.href = url
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            Coaching Access
          </CardTitle>
          <CardDescription className="text-slate-400">
            Unlock unlimited session scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">$15</div>
            <p className="text-slate-400">per month</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Unlimited session scheduling</p>
                <p className="text-slate-400 text-sm">
                  Book as many coaching sessions as you need
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Flexible scheduling</p>
                <p className="text-slate-400 text-sm">
                  Choose times that work for you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Cancel anytime</p>
                <p className="text-slate-400 text-sm">
                  No long-term commitment required
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </Button>

          <p className="text-xs text-center text-slate-500">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

