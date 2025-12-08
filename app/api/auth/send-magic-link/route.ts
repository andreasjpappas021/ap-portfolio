import { createAdminClient } from '@/lib/supabase/admin'
import { sendAuthEmail } from '@/lib/customerio-server'
import { getAppUrl } from '@/lib/app-url'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, redirect } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const appUrl = getAppUrl(request)
    const redirectTo = redirect || '/dashboard'
    const emailRedirectTo = `${appUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`

    // Generate magic link using Supabase Admin API
    const adminSupabase = createAdminClient()
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: emailRedirectTo,
      },
    })

    if (linkError) {
      console.error('[Auth] Error generating magic link:', linkError)
      return NextResponse.json(
        { error: linkError.message || 'Failed to generate magic link' },
        { status: 500 }
      )
    }

    if (!linkData?.properties?.action_link) {
      console.error('[Auth] No action_link in generated link data')
      return NextResponse.json(
        { error: 'Failed to generate magic link' },
        { status: 500 }
      )
    }

    const magicLinkUrl = linkData.properties.action_link

    // Send email via Customer.io
    try {
      await sendAuthEmail(
        email,
        '6',
        {
          custom_url: magicLinkUrl,
          magic_link_url: magicLinkUrl, // Keep both for compatibility
          email: email,
          redirect_url: redirectTo,
        }
      )
    } catch (emailError: any) {
      console.error('[Auth] Error sending auth email:', {
        error: emailError.message,
        stack: emailError.stack,
        email: email,
      })
      // Return detailed error in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Failed to send email: ${emailError.message}` 
        : 'Failed to send email. Please try again.'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Auth] Error in send-magic-link:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

