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
    // Check if script tag exists
    const scriptTag = document.getElementById('customerio-website-source')
    
    console.log('[Customer.io Debug]', {
      exists: !!window.cioanalytics,
      isArray: Array.isArray(window.cioanalytics),
      type: typeof window.cioanalytics,
      hasTrack: window.cioanalytics && 'track' in window.cioanalytics,
      trackType: window.cioanalytics && typeof (window.cioanalytics as any).track,
      queueLength: Array.isArray(window.cioanalytics) ? window.cioanalytics.length : 'N/A',
      scriptTagExists: !!scriptTag,
      scriptTagSrc: scriptTag?.getAttribute('src') || 'N/A (inline script)',
    })
  }
}

export function identify(attributes: Attributes) {
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

    // Handle queue pattern (pre-initialization) - cioanalytics is an array
    if (Array.isArray(window.cioanalytics)) {
      window.cioanalytics.push(['identify', attributes])
    }
    // Handle initialized state - cioanalytics is an object with methods
    else if (typeof window.cioanalytics.identify === 'function') {
      window.cioanalytics.identify(attributes)
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


