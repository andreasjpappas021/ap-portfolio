import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors when env vars aren't available
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set. Please add it to your environment variables.')
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

// Use Proxy to lazily initialize Stripe only when properties are accessed
// This prevents build-time errors when STRIPE_SECRET_KEY is not available
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, _receiver) {
    const instance = getStripe()
    const value = instance[prop as keyof Stripe]
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})


