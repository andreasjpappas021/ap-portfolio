/**
 * Helper to get the correct app URL for redirects
 * 
 * Uses the request's host header to get the actual domain the user is accessing.
 * This works for both production and preview deployments.
 */
export function getAppUrl(request?: { headers: Headers }): string {
  // Prefer explicit production URL if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Use the request's host header to get the actual domain being accessed
  // This is the most reliable way - it uses whatever domain the user actually hit
  if (request) {
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    if (host) {
      return `${protocol}://${host}`
    }
  }
  
  // Fallback to VERCEL_URL if no request available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback to localhost for local development
  return 'http://localhost:3000'
}

