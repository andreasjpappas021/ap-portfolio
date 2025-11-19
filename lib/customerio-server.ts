/**
 * Customer.io Server-side API integration
 * Sends events via Customer.io REST API
 */

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
  const siteId = process.env.CIO_SITE_ID

  if (!apiKey || !siteId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Customer.io] Missing CIO_API_KEY or CIO_SITE_ID. Event not sent:',
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
  const siteId = process.env.CIO_SITE_ID

  if (!apiKey || !siteId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Customer.io] Missing CIO_API_KEY or CIO_SITE_ID. User not identified.'
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
 * Send a transactional email via Customer.io
 */
export async function sendTransactionalEmail(
  userId: string,
  transactionalId: string,
  data?: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.CIO_API_KEY
  const siteId = process.env.CIO_SITE_ID

  if (!apiKey || !siteId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Customer.io] Missing CIO_API_KEY or CIO_SITE_ID. Transactional email not sent.'
      )
    }
    return
  }

  try {
    const response = await fetch(
      `https://track.customer.io/api/v1/customers/${userId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${siteId}:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          transactional_message_id: transactionalId,
          message_data: data || {},
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
      console.error('[Customer.io] Error sending transactional email:', error)
    }
  }
}


