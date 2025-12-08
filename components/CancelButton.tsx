'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CancelButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Track cancellation confirmed event
      await fetch('/api/customerio/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          eventName: 'cancellation_confirmed',
          data: {
            timestamp: new Date().toISOString(),
          },
        }),
      })

      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Success - redirect to dashboard
      router.push('/dashboard?cancelled=true')
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      alert(error.message || 'Failed to cancel subscription. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? 'Cancelling...' : 'Yes, cancel my subscription'}
    </Button>
  )
}


