'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

export default function PurchasePage() {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
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
            Consulting Session
          </CardTitle>
          <CardDescription className="text-slate-400">
            Book a 30-minute coaching session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">$99</div>
            <p className="text-slate-400">One-time payment</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">30-minute session</p>
                <p className="text-slate-400 text-sm">
                  Personalized coaching tailored to your needs
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Flexible scheduling</p>
                <p className="text-slate-400 text-sm">
                  Choose a time that works for you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Expert guidance</p>
                <p className="text-slate-400 text-sm">
                  Get insights from an experienced product leader
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
            {loading ? 'Processing...' : 'Continue to Payment'}
          </Button>

          <p className="text-xs text-center text-slate-500">
            Secure payment powered by Stripe
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

