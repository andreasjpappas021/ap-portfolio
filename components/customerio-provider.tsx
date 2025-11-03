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

  return null
}


