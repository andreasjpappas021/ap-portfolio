declare global {
  interface Window {
    cioanalytics?:
      | {
          identify: (payload: Record<string, unknown>) => void
          page: (payload?: Record<string, unknown>) => void
          track: (eventName: string, payload?: Record<string, unknown>) => void
        }
      | Array<unknown>
  }
}

type Attributes = Record<string, unknown>

// Debug helper to check Customer.io status (dev only)
export function debugCustomerIO() {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const cio = window.cioanalytics
    const debugInfo = {
      initialized: cio && !Array.isArray(cio),
      isArray: Array.isArray(cio),
      hasIdentify: cio && typeof cio.identify === 'function',
    }
    console.log('[Customer.io Debug]', debugInfo)
    return debugInfo
  }
}

export function identify(attributes: Attributes & { id?: string }) {
  try {
    if (typeof window === 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Customer.io] identify() called on server side')
      }
      return
    }

    if (!window.cioanalytics) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Customer.io] cioanalytics not found. Identify not called')
      }
      return
    }

    // Extract id from attributes - Customer.io requires userId as first parameter
    const userId = attributes.id
    if (!userId) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Customer.io] identify() called without id. In-app messages require user identification.')
      }
      return
    }

    // Create attributes object without id
    const attrs = { ...attributes }
    delete attrs.id

    // Handle queue pattern (pre-initialization) - cioanalytics is an array
    // Analytics.js format: ['identify', userId, traits]
    if (Array.isArray(window.cioanalytics)) {
      window.cioanalytics.push(['identify', userId, attrs])
    }
    // Handle initialized state - cioanalytics is an object with methods
    // Customer.io format: identify(userId, attributes)
    else if (typeof window.cioanalytics.identify === 'function') {
      window.cioanalytics.identify(userId, attrs)
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Customer.io] User identified:', userId)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Customer.io] Error identifying user:', error, attributes)
    }
  }
}

export function page(properties?: Attributes) {
  try {
    if (typeof window !== 'undefined' && window.cioanalytics) {
      // Handle queue pattern (pre-initialization) - cioanalytics is an array
      if (Array.isArray(window.cioanalytics)) {
        window.cioanalytics.push(['page', properties ?? {}])
      }
      // Handle initialized state - cioanalytics is an object with methods
      else if (typeof window.cioanalytics.page === 'function') {
        window.cioanalytics.page(properties ?? {})
      }
    }
  } catch (_) {}
}

export function track(eventName: string, properties?: Attributes) {
  try {
    if (typeof window === 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Customer.io] track() called on server side')
      }
      return
    }

    if (!window.cioanalytics) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Customer.io] cioanalytics not found. Event not tracked:', eventName, properties)
      }
      return
    }

    // Handle queue pattern (pre-initialization) - cioanalytics is an array
    if (Array.isArray(window.cioanalytics)) {
      window.cioanalytics.push(['track', eventName, properties ?? {}])
    }
    // Handle initialized state - cioanalytics is an object with methods
    else if (typeof window.cioanalytics.track === 'function') {
      window.cioanalytics.track(eventName, properties ?? {})
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Customer.io] Error tracking event:', error, eventName, properties)
    }
  }
}


