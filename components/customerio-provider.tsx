'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { page } from '@/lib/customerio'

export default function CustomerIOProvider() {
  const pathname = usePathname()

  useEffect(() => {
    // Track page views for in-app message targeting
    page({ path: pathname || '/' })
  }, [pathname])

  return null
}


