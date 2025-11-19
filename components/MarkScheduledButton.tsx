'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type MarkScheduledButtonProps = {
  purchaseId?: string
}

export default function MarkScheduledButton({ purchaseId }: MarkScheduledButtonProps) {
  const [loading, setLoading] = useState(false)
  const [marked, setMarked] = useState(false)
  const router = useRouter()

  const handleMarkScheduled = async () => {
    if (!purchaseId) return

    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Update the purchase to mark as scheduled
      const { error } = await supabase
        .from('session_purchases')
        .update({ scheduled_at: new Date().toISOString() })
        .eq('id', purchaseId)
        .eq('user_id', user.id)

      if (error) throw error

      // Track meeting scheduled event
      try {
        await fetch('/api/customerio/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            eventName: 'meeting_scheduled',
            data: {
              purchase_id: purchaseId,
              scheduled_at: new Date().toISOString(),
            },
          }),
        })
      } catch (trackError) {
        console.error('Error tracking meeting_scheduled event:', trackError)
        // Don't throw - tracking shouldn't break the flow
      }

      setMarked(true)
      // Refresh the page to show prep section
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error('Error marking as scheduled:', error)
      alert('Failed to mark as scheduled. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (marked) {
    return (
      <Button disabled className="bg-green-600 text-white">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Session Scheduled!
      </Button>
    )
  }

  return (
    <Button
      onClick={handleMarkScheduled}
      disabled={loading || !purchaseId}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {loading ? 'Marking...' : "I've Scheduled My Session"}
    </Button>
  )
}


