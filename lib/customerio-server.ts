/**
 * Customer.io Server-side API integration
 * Sends events via Customer.io REST API
 */

import { createAdminClient } from '@/lib/supabase/admin'

type CustomerIOEvent = {
  name: string
  data?: Record<string, unknown>
}

type CustomerIOAttributes = {
  id: string
  email: string
  [key: string]: unknown
}

/**
 * Send a behavioral event to Customer.io
 */
export async function trackEvent(
  userId: string,
  eventName: string,
  data?: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.CIO_API_KEY
  const siteId = process.env.NEXT_PUBLIC_CIO_SITE_ID || process.env.CIO_SITE_ID

  if (!apiKey || !siteId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Customer.io] Missing CIO_API_KEY or site ID. Event not sent:',
        eventName
      )
    }
    return
  }

  try {
    const response = await fetch(
      `https://track.customer.io/api/v1/customers/${userId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${siteId}:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          name: eventName,
          data: data || {},
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Customer.io API error: ${response.status} ${errorText}`
      )
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Customer.io] Error sending event:', error)
    }
    // Don't throw - we don't want to break the app if Customer.io is down
  }
}

/**
 * Identify a user in Customer.io (create or update)
 */
export async function identifyUser(
  attributes: CustomerIOAttributes
): Promise<void> {
  const apiKey = process.env.CIO_API_KEY
  const siteId = process.env.NEXT_PUBLIC_CIO_SITE_ID || process.env.CIO_SITE_ID

  if (!apiKey || !siteId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Customer.io] Missing CIO_API_KEY or site ID. User not identified.'
      )
    }
    return
  }

  try {
    const response = await fetch(
      `https://track.customer.io/api/v1/customers/${attributes.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${siteId}:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify(attributes),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Customer.io API error: ${response.status} ${errorText}`
      )
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Customer.io] Error identifying user:', error)
    }
  }
}

/**
 * Send a transactional email via Customer.io App API
 * Uses the App API (separate from Track API) for transactional messages
 */
export async function sendTransactionalEmail(
  userId: string,
  transactionalId: string,
  data?: Record<string, unknown>
): Promise<void> {
  const appApiKey = process.env.CIO_APP_API_KEY

  if (!appApiKey) {
    console.warn(
      '[Customer.io] Missing CIO_APP_API_KEY. Transactional email not sent.'
    )
    console.warn('[Customer.io] Debug: CIO_APP_API_KEY is', appApiKey ? 'set' : 'undefined')
    return
  }

  console.log('[Customer.io] Sending transactional email:', {
    userId,
    transactionalId,
    hasData: !!data,
    appApiKeySet: !!appApiKey,
  })

  try {
    // Fetch user email from Supabase
    const adminSupabase = createAdminClient()
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error(
        '[Customer.io] ❌ Error fetching user email from database:',
        {
          error: userError,
          errorCode: userError.code,
          errorMessage: userError.message,
          userId,
        }
      )
      return
    }

    if (!user?.email) {
      console.error(
        '[Customer.io] ❌ User not found or has no email:',
        {
          userId,
          userFound: !!user,
          hasEmail: !!user?.email,
        }
      )
      return
    }

    console.log('[Customer.io] ✅ Found user email:', {
      userId,
      email: user.email,
      transactionalId,
    })

    // Prepare request payload
    const requestPayload = {
      transactional_message_id: transactionalId,
      identifiers: {
        id: userId,
      },
      to: user.email,
      message_data: data || {},
    }

    console.log('[Customer.io] Sending email request to Customer.io App API...', {
      endpoint: 'https://api.customer.io/v1/send/email',
      transactionalId,
      recipientEmail: user.email,
      hasMessageData: !!data,
      messageData: data, // Log the actual data being sent
    })
    
    console.log('[Customer.io] Full request payload:', JSON.stringify(requestPayload, null, 2))

    // Send transactional email via Customer.io App API
    const response = await fetch('https://api.customer.io/v1/send/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    })

    const responseText = await response.text()
    let responseData: any = null

    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch (parseError) {
      // Response is not JSON, that's okay
    }

    if (!response.ok) {
      console.error('[Customer.io] ❌ App API error response:', {
        status: response.status,
        statusText: response.statusText,
        responseText,
        responseData,
        transactionalId,
        userId,
        recipientEmail: user.email,
      })
      throw new Error(
        `Customer.io App API error: ${response.status} ${response.statusText} - ${responseText}`
      )
    }

    console.log('[Customer.io] ✅ Transactional email sent successfully:', {
      response: responseData,
      transactionalId,
      userId,
      recipientEmail: user.email,
      messageId: responseData?.message_id || responseData?.id || 'unknown',
    })
  } catch (error: any) {
    console.error('[Customer.io] ❌ Error sending transactional email:', {
      error: error.message,
      errorStack: error.stack,
      statusCode: error.statusCode,
      response: error.response,
      userId,
      transactionalId,
    })
    
    // Log additional details if available
    if (error.statusCode) {
      console.error(`[Customer.io] HTTP Status: ${error.statusCode}`)
    }
    if (error.response) {
      console.error('[Customer.io] Error Response:', error.response)
    }
    
    // Don't throw - we don't want to break the app if Customer.io is down
  }
}

/**
 * Send an authentication email via Customer.io App API
 * Used for magic links (login and signup) where we may not have a userId yet
 */
export async function sendAuthEmail(
  email: string,
  transactionalId: string,
  messageData: Record<string, unknown>
): Promise<void> {
  const appApiKey = process.env.CIO_APP_API_KEY

  if (!appApiKey) {
    const error = new Error('Missing CIO_APP_API_KEY environment variable')
    console.error('[Customer.io] ❌ Missing CIO_APP_API_KEY. Auth email not sent.')
    throw error
  }

  console.log('[Customer.io] Sending auth email:', {
    email,
    transactionalId,
    hasMessageData: !!messageData,
  })

  try {
    // Prepare request payload
    // For auth emails, we use email as the identifier since user may not exist yet
    const requestPayload: any = {
      transactional_message_id: transactionalId,
      identifiers: {
        email: email,
      },
      to: email,
      message_data: messageData,
    }
    
    // Add "from" field (Customer.io requires this if not set in template)
    // You can set this in your Customer.io transactional message settings, or via env var
    const fromEmail = process.env.CIO_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@andreasjpappas.com'
    requestPayload.from = fromEmail

    console.log('[Customer.io] Sending auth email request to Customer.io App API...', {
      endpoint: 'https://api.customer.io/v1/send/email',
      transactionalId,
      recipientEmail: email,
      hasMessageData: !!messageData,
      messageDataKeys: Object.keys(messageData),
      magicLinkUrl: messageData.magic_link_url,
    })
    
    console.log('[Customer.io] Full request payload:', JSON.stringify(requestPayload, null, 2))

    // Send transactional email via Customer.io App API
    const response = await fetch('https://api.customer.io/v1/send/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    })

    const responseText = await response.text()
    let responseData: any = null

    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch (parseError) {
      // Response is not JSON, that's okay
    }

    if (!response.ok) {
      console.error('[Customer.io] ❌ App API error response:', {
        status: response.status,
        statusText: response.statusText,
        responseText,
        responseData,
        transactionalId,
        recipientEmail: email,
      })
      throw new Error(
        `Customer.io App API error: ${response.status} ${response.statusText} - ${responseText}`
      )
    }

    console.log('[Customer.io] ✅ Auth email sent successfully:', {
      response: responseData,
      transactionalId,
      recipientEmail: email,
      messageId: responseData?.message_id || responseData?.id || 'unknown',
    })
  } catch (error: any) {
    console.error('[Customer.io] ❌ Error sending auth email:', {
      error: error.message,
      errorStack: error.stack,
      transactionalId,
      recipientEmail: email,
    })
    
    // Re-throw error so caller can handle it appropriately
    throw error
  }
}


