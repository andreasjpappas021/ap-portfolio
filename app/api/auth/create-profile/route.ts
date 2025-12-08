import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent, identifyUser } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to create user profile and track events after authentication
 * Called from the client-side callback page after session is set
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()

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

    // Create or update user profile if it doesn't exist
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

      return NextResponse.json({ 
        success: true, 
        isNewUser: true,
        message: 'Profile created' 
      })
    }

    return NextResponse.json({ 
      success: true, 
      isNewUser: false,
      message: 'Profile already exists' 
    })
  } catch (error: any) {
    console.error('[Create Profile] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    )
  }
}


