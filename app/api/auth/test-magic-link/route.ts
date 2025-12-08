import { createAdminClient } from '@/lib/supabase/admin'
import { sendAuthEmail } from '@/lib/customerio-server'
import { getAppUrl } from '@/lib/app-url'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint for auth magic links
 * 
 * Usage:
 * POST /api/auth/test-magic-link
 * Body: { email: "test@example.com", type: "login" | "signup" }
 * 
 * Or for signup:
 * Body: { email: "test@example.com", type: "signup", name: "John Doe", job: "PM", company: "Acme" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type = 'login', name, job, company } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const appUrl = getAppUrl(request)
    const redirectTo = '/dashboard'
    const emailRedirectTo = `${appUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`

    const adminSupabase = createAdminClient()

    // Generate the appropriate link type
    const linkType = type === 'signup' ? 'signup' : 'magiclink'
    const transactionalId = type === 'signup' ? '7' : '6' // Login uses 6, signup uses 7

    const linkOptions: any = {
      type: linkType,
      email: email,
      options: {
        redirectTo: emailRedirectTo,
      },
    }

    // Add user metadata for signup
    if (type === 'signup') {
      linkOptions.options.data = {
        name: name || 'Test User',
        job: job || '',
        company: company || '',
      }
    }

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink(linkOptions)

    if (linkError) {
      console.error('[Test] Error generating magic link:', linkError)
      return NextResponse.json(
        { error: linkError.message || 'Failed to generate magic link' },
        { status: 500 }
      )
    }

    if (!linkData?.properties?.action_link) {
      return NextResponse.json(
        { error: 'Failed to generate magic link' },
        { status: 500 }
      )
    }

    const magicLinkUrl = linkData.properties.action_link

    // Prepare message data
    const messageData: Record<string, unknown> = {
      magic_link_url: magicLinkUrl,
      email: email,
      redirect_url: redirectTo,
    }

    if (type === 'signup') {
      messageData.name = name || 'Test User'
      messageData.job = job || ''
      messageData.company = company || ''
    }

    // Send email via Customer.io
    try {
      await sendAuthEmail(email, transactionalId, messageData)
    } catch (emailError: any) {
      console.error('[Test] Error sending test email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email: ' + emailError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent!`,
      email: email,
      magicLinkUrl: magicLinkUrl,
      transactionalId: transactionalId,
    })
  } catch (error: any) {
    console.error('[Test] Error in test-magic-link:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

