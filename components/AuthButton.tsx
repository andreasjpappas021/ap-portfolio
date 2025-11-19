'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isAuthenticated === null) {
    // Loading state - return nothing or a placeholder
    return null
  }

  if (isAuthenticated) {
    return (
      <Button
        onClick={() => router.push('/dashboard')}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Dashboard
      </Button>
    )
  }

  return (
    <Button
      onClick={() => router.push('/auth/login')}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Book a Session
    </Button>
  )
}


