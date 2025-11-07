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

export function identify(attributes: Attributes) {
  try {
    if (typeof window !== 'undefined' && window.cioanalytics) {
      // Handle queue pattern (pre-initialization) - cioanalytics is an array
      if (Array.isArray(window.cioanalytics)) {
        window.cioanalytics.push(['identify', attributes])
      }
      // Handle initialized state - cioanalytics is an object with methods
      else if (typeof window.cioanalytics.identify === 'function') {
        window.cioanalytics.identify(attributes)
      }
    }
  } catch (_) {}
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
    if (typeof window !== 'undefined' && window.cioanalytics) {
      // Handle queue pattern (pre-initialization) - cioanalytics is an array
      if (Array.isArray(window.cioanalytics)) {
        window.cioanalytics.push(['track', eventName, properties ?? {}])
      }
      // Handle initialized state - cioanalytics is an object with methods
      else if (typeof window.cioanalytics.track === 'function') {
        window.cioanalytics.track(eventName, properties ?? {})
      }
    }
  } catch (_) {}
}


