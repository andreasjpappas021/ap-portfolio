declare global {
  interface Window {
    cioanalytics?: {
      identify: (payload: Record<string, unknown>) => void
      page: (payload?: Record<string, unknown>) => void
      track: (eventName: string, payload?: Record<string, unknown>) => void
    }
  }
}

type Attributes = Record<string, unknown>

export function identify(attributes: Attributes) {
  try {
    if (typeof window !== 'undefined' && window.cioanalytics && typeof window.cioanalytics.identify === 'function') {
      window.cioanalytics.identify(attributes)
    }
  } catch (_) {}
}

export function page(properties?: Attributes) {
  try {
    if (typeof window !== 'undefined' && window.cioanalytics && typeof window.cioanalytics.page === 'function') {
      window.cioanalytics.page(properties ?? {})
    }
  } catch (_) {}
}

export function track(eventName: string, properties?: Attributes) {
  try {
    if (typeof window !== 'undefined' && window.cioanalytics && typeof window.cioanalytics.track === 'function') {
      window.cioanalytics.track(eventName, properties ?? {})
    }
  } catch (_) {}
}


