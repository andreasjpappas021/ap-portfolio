import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Middleware] Missing Supabase environment variables')
      // Allow request to continue if env vars are missing (graceful degradation)
      // This prevents the entire site from breaking if env vars aren't set
      return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    let supabase
    try {
      supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              try {
                return request.cookies.getAll()
              } catch (error) {
                console.error('[Middleware] Error getting cookies:', error)
                return []
              }
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  request.cookies.set(name, value)
                )
                supabaseResponse = NextResponse.next({
                  request,
                })
                cookiesToSet.forEach(({ name, value, options }) =>
                  supabaseResponse.cookies.set(name, value, options)
                )
              } catch (error) {
                console.error('[Middleware] Error setting cookies:', error)
              }
            },
          },
        }
      )
    } catch (error) {
      console.error('[Middleware] Error creating Supabase client:', error)
      // If client creation fails, continue without auth
      return NextResponse.next()
    }

    // Refresh session if expired
    let user = null
    if (supabase) {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        user = authUser
      } catch (error) {
        // If getUser fails, continue without user (graceful degradation)
        console.error('[Middleware] Error getting user:', error)
      }
    }

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!user) {
        try {
          const url = request.nextUrl.clone()
          url.pathname = '/auth/login'
          url.searchParams.set('redirect', request.nextUrl.pathname)
          return NextResponse.redirect(url)
        } catch (error) {
          console.error('[Middleware] Error creating redirect URL:', error)
          // If redirect fails, continue to dashboard (will show error page)
          return NextResponse.next()
        }
      }
    }

    // Redirect authenticated users away from auth pages
    if (
      request.nextUrl.pathname.startsWith('/auth/login') ||
      request.nextUrl.pathname.startsWith('/auth/register')
    ) {
      if (user) {
        try {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        } catch (error) {
          console.error('[Middleware] Error creating redirect URL:', error)
          // If redirect fails, continue to auth page
          return NextResponse.next()
        }
      }
    }

    return supabaseResponse
  } catch (error) {
    // Catch any unexpected errors and log them
    console.error('[Middleware] Unexpected error:', error)
    // Return a response to prevent the middleware from crashing
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


