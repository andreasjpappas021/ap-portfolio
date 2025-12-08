'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient()
        const redirectTo = searchParams.get('redirect') || '/dashboard'

        // Check if we have tokens in the URL hash (from Supabase redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          // Set the session using the tokens from the hash
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('[Auth Callback] Error setting session:', error)
            setStatus('error')
            router.push(`/auth/login?error=session_failed&redirect=${encodeURIComponent(redirectTo)}`)
            return
          }

          if (data?.user) {
            console.log('[Auth Callback] Successfully authenticated user:', data.user.id)
            
            // Create user profile and track events (if new user)
            try {
              await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            } catch (profileError) {
              console.error('[Auth Callback] Error creating profile:', profileError)
              // Don't block redirect if profile creation fails
            }
            
            setStatus('success')
            setTimeout(() => {
              router.push(redirectTo)
            }, 100)
            return
          }
        }

        // If no hash tokens, check for code parameter (PKCE flow)
        const code = searchParams.get('code')
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('[Auth Callback] Error exchanging code:', error)
            setStatus('error')
            router.push(`/auth/login?error=code_exchange_failed&redirect=${encodeURIComponent(redirectTo)}`)
            return
          }

          if (data?.user) {
            console.log('[Auth Callback] Successfully authenticated user via code:', data.user.id)
            
            // Create user profile and track events (if new user)
            try {
              await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            } catch (profileError) {
              console.error('[Auth Callback] Error creating profile:', profileError)
              // Don't block redirect if profile creation fails
            }
            
            setStatus('success')
            setTimeout(() => {
              router.push(redirectTo)
            }, 100)
            return
          }
        }

        // No tokens or code found
        console.warn('[Auth Callback] No authentication tokens found')
        setStatus('error')
        router.push(`/auth/login?error=invalid_link&redirect=${encodeURIComponent(redirectTo)}`)
      } catch (error) {
        console.error('[Auth Callback] Unexpected error:', error)
        setStatus('error')
        router.push('/auth/login?error=unexpected_error')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Completing sign in...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Authentication failed</div>
          <div className="text-slate-400">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  return null
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Loading...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

