'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { page } from '@/lib/customerio'

export default function CustomerIOProvider() {
  const pathname = usePathname()

  useEffect(() => {
    // Just track page views - no gate/redirect logic
    page({ path: pathname || '/' })
  }, [pathname])

  return null
}


