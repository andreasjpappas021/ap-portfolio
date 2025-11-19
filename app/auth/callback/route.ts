import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent, identifyUser } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const adminSupabase = createAdminClient()
      const user = data.user

      // Get user metadata from auth (set during registration)
      const userMetadata = user.user_metadata || {}
      const name = userMetadata.name || ''
      const job = userMetadata.job || ''
      const company = userMetadata.company || ''

      // Check if user profile exists
      const { data: existingProfile } = await adminSupabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Create or update user profile
      if (!existingProfile) {
        await adminSupabase.from('users').upsert({
          id: user.id,
          email: user.email!,
          name: name,
          job: job,
          company: company,
        })

        // Track registration event (server-side)
        await identifyUser({
          id: user.id,
          email: user.email!,
          name: name,
          job: job,
          company: company,
        })

        await trackEvent(user.id, 'user_registered', {
          email: user.email,
          job: job,
          company: company,
        })

        await logAuditEvent(user.id, 'user_registered', {
          email: user.email,
          job: job,
          company: company,
        })
      }
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url))
}

