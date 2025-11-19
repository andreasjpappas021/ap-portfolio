'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function StripeSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function handleStripeSuccess() {
      if (!sessionId) {
        setStatus('error')
        setTimeout(() => router.push('/dashboard/purchase'), 2000)
        return
      }

      try {
        const supabase = createClient()
        
        // First, try to get the current session (might be in browser cookies)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session && !sessionError) {
          // Session exists, verify user and redirect to dashboard
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // User is authenticated, redirect to dashboard
            router.push('/dashboard')
            return
          }
        }

        // Try to refresh the session in case it expired but refresh token exists
        if (session?.refresh_token) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession(session)
          if (refreshData.session && !refreshError) {
            router.push('/dashboard')
            return
          }
        }

        // If no valid session, check if we can get user info from localStorage or try to restore
        // As a last resort, redirect to login - the payment has already been processed
        // so they just need to log back in to see their dashboard
        console.log('No valid session found, redirecting to login')
        router.push(`/auth/login?redirect=/dashboard&message=payment_success`)
      } catch (error) {
        console.error('Error handling Stripe success:', error)
        // Even on error, redirect to login since payment was processed
        router.push(`/auth/login?redirect=/dashboard&message=payment_success`)
      }
    }

    // Small delay to ensure cookies are available
    const timer = setTimeout(() => {
      handleStripeSuccess()
    }, 100)

    return () => clearTimeout(timer)
  }, [sessionId, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Processing your payment...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Something went wrong</div>
          <div className="text-slate-400">Redirecting...</div>
        </div>
      </div>
    )
  }

  return null
}

export default function StripeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="text-center">
            <div className="text-white text-xl mb-4">Processing your payment...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      }
    >
      <StripeSuccessContent />
    </Suspense>
  )
}

