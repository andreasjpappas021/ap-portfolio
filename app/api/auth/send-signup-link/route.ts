import { createAdminClient } from '@/lib/supabase/admin'
import { sendAuthEmail } from '@/lib/customerio-server'
import { getAppUrl } from '@/lib/app-url'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, job, company, redirect } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const appUrl = getAppUrl(request)
    const redirectTo = redirect || '/dashboard'
    const emailRedirectTo = `${appUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`

    const adminSupabase = createAdminClient()
    
    // Try to create the user first (no password needed)
    // If they already exist, we'll catch the error and generate a magic link anyway
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: email,
      email_confirm: false, // They'll confirm via magic link
      user_metadata: {
        name: name,
        job: job || '',
        company: company || '',
      },
    })
    
    // If user already exists, that's fine - we'll just generate a magic link
    // The error message will indicate if it's a duplicate user
    if (createError && !createError.message?.includes('already registered')) {
      console.error('[Auth] Error creating user:', createError)
      // If it's not a "user exists" error, return the error
      if (!createError.message?.toLowerCase().includes('user') || !createError.message?.toLowerCase().includes('exist')) {
        return NextResponse.json(
          { error: createError.message || 'Failed to create user' },
          { status: 500 }
        )
      }
    }
    
    // Generate magic link (works for both new and existing users)
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: emailRedirectTo,
        data: {
          name: name,
          job: job || '',
          company: company || '',
        },
      },
    })

    if (linkError) {
      console.error('[Auth] Error generating signup link:', linkError)
      return NextResponse.json(
        { error: linkError.message || 'Failed to generate signup link' },
        { status: 500 }
      )
    }

    if (!linkData?.properties?.action_link) {
      console.error('[Auth] No action_link in generated link data')
      return NextResponse.json(
        { error: 'Failed to generate signup link' },
        { status: 500 }
      )
    }

    const magicLinkUrl = linkData.properties.action_link

    // Send email via Customer.io
    try {
      await sendAuthEmail(
        email,
        '7',
        {
          custom_url: magicLinkUrl,
          magic_link_url: magicLinkUrl, // Keep both for compatibility
          email: email,
          redirect_url: redirectTo,
          name: name,
          job: job || '',
          company: company || '',
        }
      )
    } catch (emailError: any) {
      console.error('[Auth] Error sending signup email:', emailError)
      // Still return success to user, but log the error
      // The magic link was generated successfully, email failure is a separate issue
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Auth] Error in send-signup-link:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

