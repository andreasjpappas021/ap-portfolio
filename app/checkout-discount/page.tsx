'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutDiscountPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function trackButtonClick() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Track clicked_button event
          await fetch('/api/customerio/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              eventName: 'clicked_button',
              data: {
                button_type: 'discount_checkout',
                source: 'iam',
                timestamp: new Date().toISOString(),
              },
            }),
          })
        }
      } catch (error) {
        console.error('Error tracking button click:', error)
        // Continue even if tracking fails
      }
    }

    async function applyDiscount() {
      // Track the button click first
      await trackButtonClick()

      try {
        const response = await fetch('/api/stripe/checkout-discount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to apply discount')
        }

        // If we got a URL, redirect to Stripe checkout (new subscription with discount)
        if (data.url) {
          window.location.href = data.url
          return
        }

        // Otherwise, discount was applied to existing subscription - redirect to dashboard
        router.push('/dashboard?discount_applied=true')
      } catch (error: any) {
        console.error('Discount application error:', error)
        setError(error.message || 'Something went wrong. Please try again.')
        // Redirect to dashboard after a delay if there's an error
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    }

    applyDiscount()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-slate-400 text-sm">Redirecting you back...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <p className="text-white">Applying discount...</p>
      </div>
    </div>
  )
}

