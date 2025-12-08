/**
 * Helper to get the correct app URL for redirects
 * 
 * This uses the same logic that was working before - prefer NEXT_PUBLIC_APP_URL
 * if set, otherwise use VERCEL_URL (which is always set in Vercel deployments).
 * 
 * The key difference from using request.url is that this avoids using
 * preview URLs from incoming requests, but still works with Vercel's
 * automatic URL detection.
 */
export function getAppUrl(): string {
  // Prefer explicit production URL if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Use VERCEL_URL if available (always set in Vercel deployments)
  // This was the original working logic - VERCEL_URL is reliable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback to localhost for local development
  return 'http://localhost:3000'
}

