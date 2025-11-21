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
  })

  try {
    // Fetch user email from Supabase
    const adminSupabase = createAdminClient()
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError || !user?.email) {
      console.error(
        '[Customer.io] Error fetching user email:',
        userError || 'User not found',
        'User ID:',
        userId
      )
      return
    }

    console.log('[Customer.io] Found user email:', user.email)

    // Send transactional email via Customer.io App API
    console.log('[Customer.io] Sending email request to Customer.io App API...')
    const response = await fetch('https://api.customer.io/v1/send/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appApiKey}`,
      },
      body: JSON.stringify({
        transactional_message_id: transactionalId,
        identifiers: {
          id: userId,
        },
        to: user.email,
        message_data: data || {},
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Customer.io App API error: ${response.status} ${errorText}`
      )
    }

    const result = await response.json()
    console.log('[Customer.io] ✅ Transactional email sent successfully:', result)
  } catch (error: any) {
    console.error('[Customer.io] ❌ Error sending transactional email:', error)
    if (error.statusCode) {
      console.error(`[Customer.io] Status: ${error.statusCode}, Message: ${error.message}`)
    }
    if (error.response) {
      console.error('[Customer.io] Response:', error.response)
    }
    // Don't throw - we don't want to break the app if Customer.io is down
  }
}


