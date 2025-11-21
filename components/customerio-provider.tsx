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
      // Identify user on every page load (if authenticated)
      if (typeof window !== 'undefined') {
        try {
          const supabase = createClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (user) {
            // Get user profile for additional attributes
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()

            // Identify user with all available attributes on every page load
            identify({
              id: user.id,
              email: user.email || '',
              name: profile?.name || user.user_metadata?.name || '',
              first_name: profile?.name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || '',
              last_name: profile?.name?.split(' ').slice(1).join(' ') || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
              job: profile?.job || user.user_metadata?.job || '',
              company: profile?.company || user.user_metadata?.company || '',
            })
          }
        } catch (error) {
          // Silently fail - user might not be authenticated
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[Customer.io] Error identifying user:', error)
          }
        }
      }

      // Track page views with page name for in-app message targeting
      const pageName = getPageName(pathname || '/')
      page({
        name: pageName,
        path: pathname || '/',
      })
    }

    // Check if Customer.io is ready
    const cio = (window as any).cioanalytics
    if (cio && !Array.isArray(cio) && typeof cio.ready === 'function') {
      // Already initialized, call ready callback
      cio.ready(initCustomerIO)
    } else if (Array.isArray(cio)) {
      // Still queuing, add ready callback to queue
      cio.push(['ready', initCustomerIO])
    } else {
      // Not loaded yet, wait a bit and try again
      setTimeout(() => {
        const cioLater = (window as any).cioanalytics
        if (cioLater && !Array.isArray(cioLater) && typeof cioLater.ready === 'function') {
          cioLater.ready(initCustomerIO)
        } else {
          // Fallback: just try to identify/track anyway
          initCustomerIO()
        }
      }, 1000)
    }
  }, [pathname])

  return null
}


