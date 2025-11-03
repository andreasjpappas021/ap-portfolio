'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { page } from '@/lib/customerio'

export default function CustomerIOProvider() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isGate = pathname === '/gate'
      const gate = window.localStorage.getItem('ci_gate')
      if (!isGate && !gate) {
        router.replace('/gate')
        return
      }
    }

    page({ path: pathname || '/' })
  }, [pathname, router])

  // Dev-only helper to clear gate and reset Customer.io for quick re-tests
  if (process.env.NODE_ENV !== 'production') {
    return (
      <button
        onClick={() => {
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('ci_gate')
              if (window.cioanalytics && typeof window.cioanalytics.reset === 'function') {
                window.cioanalytics.reset()
              }
            }
          } catch (_) {}
          router.replace('/gate')
        }}
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 9999,
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid #ddd',
          background: '#fafafa',
          color: '#111',
          cursor: 'pointer',
          fontSize: 12,
        }}
        aria-label="Clear access and reset Customer.io"
      >
        Clear access
      </button>
    )
  }

  return null
}


