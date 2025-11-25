'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { page, identify } from '@/lib/customerio'

// Helper function to get page name from pathname
function getPageName(pathname: string): string {
  if (pathname === '/') return 'Home'
  if (pathname.startsWith('/dashboard')) {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname === '/dashboard/purchase') return 'Purchase'
    if (pathname === '/dashboard/schedule') return 'Schedule'
    if (pathname === '/dashboard/settings') return 'Settings'
    return 'Dashboard'
  }
  if (pathname.startsWith('/auth')) {
    if (pathname === '/auth/login') return 'Login'
    if (pathname === '/auth/register') return 'Register'
    if (pathname === '/auth/stripe-success') return 'Stripe Success'
    return 'Auth'
  }
  if (pathname.startsWith('/photography')) {
    if (pathname === '/photography') return 'Photography'
    return 'Photography Album'
  }
  // Fallback: capitalize first letter and replace slashes/dashes with spaces
  return pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Home'
}

export default function CustomerIOProvider() {
  const pathname = usePathname()

  useEffect(() => {
    // Wait for Customer.io to be ready, then identify and track page
    const initCustomerIO = async () => {
      console.log('[Customer.io] Initializing...', { pathname })
      
      // Identify user FIRST (before page tracking) - Customer.io needs user ID for in-app messages
      if (typeof window !== 'undefined') {
        try {
          const supabase = createClient()
          
          // Check if Supabase is properly configured
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('[Customer.io] Supabase environment variables not configured')
          } else {
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser()

            if (userError) {
              console.log('[Customer.io] No authenticated user:', userError.message)
            } else if (user) {
              console.log('[Customer.io] Found user, identifying...', user.id)
              
              // Get user profile for additional attributes
              const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

              // Log profile errors but continue with identification
              if (profileError && profileError.code !== 'PGRST116') {
                // PGRST116 is "not found" which is fine for new users
                console.warn('[Customer.io] Error fetching user profile:', profileError)
              }

              // Identify user with all available attributes on every page load
              // This MUST happen before page() for in-app messages to work
              // Important: Customer.io needs email in attributes for in-app message targeting
              const identifyPayload = {
                id: user.id, // Keep UUID as primary ID for consistency
                email: user.email || '', // Email is critical for in-app message targeting
                name: profile?.name || user.user_metadata?.name || '',
                first_name: profile?.name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || '',
                last_name: profile?.name?.split(' ').slice(1).join(' ') || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                job: profile?.job || user.user_metadata?.job || '',
                company: profile?.company || user.user_metadata?.company || '',
              }
              
              console.log('[Customer.io] Identifying user with payload:', { 
                id: identifyPayload.id, 
                email: identifyPayload.email,
                fullPayload: identifyPayload 
              })
              identify(identifyPayload)
              
              // Log what Customer.io should see for targeting
              console.log('[Customer.io] For message targeting, Customer.io sees:', {
                userId: identifyPayload.id,
                email: identifyPayload.email,
                pageName: getPageName(pathname || '/'),
                pagePath: pathname || '/',
              })
              
              // Longer delay to ensure Customer.io processes identification before page tracking
              // Customer.io needs time to match the user and check for in-app messages
              // In-app messages are checked when page() is called, so we need identification to complete first
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        } catch (error) {
          // Log errors in all environments for debugging
          console.error('[Customer.io] Error identifying user:', error)
        }
      }

      // Track page views with page name for in-app message targeting
      // This happens AFTER identification so Customer.io knows who to show messages to
      // Customer.io checks for in-app messages when page() is called
      const pageName = getPageName(pathname || '/')
      console.log('[Customer.io] Tracking page:', pageName, pathname)
      page({
        name: pageName,
        path: pathname || '/',
      })
      
      // After page tracking, explicitly check for in-app messages
      // Some Customer.io implementations need this to trigger message checking
      const cio = (window as any).cioanalytics
      if (cio && !Array.isArray(cio)) {
        // Try to trigger in-app message check if the method exists
        if (typeof cio.on === 'function') {
          // Listen for in-app message events
          cio.on('ready', () => {
            console.log('[Customer.io] SDK ready, checking for in-app messages')
          })
        }
      }
    }

    // Check if Customer.io is ready
    const cio = (window as any).cioanalytics
    console.log('[Customer.io] Checking initialization state:', {
      exists: !!cio,
      isArray: Array.isArray(cio),
      hasReady: cio && typeof cio.ready === 'function',
      hasIdentify: cio && typeof cio.identify === 'function',
      env: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
    
    if (cio && !Array.isArray(cio) && typeof cio.ready === 'function') {
      // Already initialized, call ready callback
      console.log('[Customer.io] SDK initialized, using ready callback')
      cio.ready(initCustomerIO)
    } else if (Array.isArray(cio)) {
      // Still queuing, add ready callback to queue
      console.log('[Customer.io] SDK queuing, adding ready callback to queue')
      cio.push(['ready', initCustomerIO])
    } else {
      // Not loaded yet, wait a bit and try again
      console.log('[Customer.io] SDK not loaded yet, waiting...')
      setTimeout(() => {
        const cioLater = (window as any).cioanalytics
        console.log('[Customer.io] Retry check:', {
          exists: !!cioLater,
          isArray: Array.isArray(cioLater),
          hasReady: cioLater && typeof cioLater.ready === 'function',
        })
        if (cioLater && !Array.isArray(cioLater) && typeof cioLater.ready === 'function') {
          console.log('[Customer.io] SDK initialized on retry, using ready callback')
          cioLater.ready(initCustomerIO)
        } else {
          // Fallback: just try to identify/track anyway
          console.log('[Customer.io] Fallback: calling initCustomerIO directly')
          initCustomerIO()
        }
      }, 1000)
    }
  }, [pathname])

  return null
}


