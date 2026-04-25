import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialize Response
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 🚨 FAILSAFE: Catch orphaned Supabase auth codes on the homepage
  // If Supabase ignores the redirect URL and dumps the user on the homepage with a code,
  // we manually route them to the callback handler so they get logged in.
  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname === '/') {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('next', '/dashboard')
    return NextResponse.redirect(callbackUrl)
  }

  // 2. Supabase Client Setup
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          //  This line resets the response, so we must set headers AFTER this block
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  let userProfile = null

  // Only fetch profile if user exists AND we are on a protected route
  if (user && (path.startsWith('/dashboard') || path.startsWith('/admin'))) {
    const { data } = await supabase
      .from('profiles')
      .select('is_banned, role')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  // Helper to maintain cookies during redirects
  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url)
    // Manually copy the updated response cookies to the new NextResponse.redirect object
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // 4. Banned User Check 
  if (userProfile?.is_banned) {
    await supabase.auth.signOut()
    return redirectWithCookies(new URL('/banned', request.url))
  }

  // 5. Protect Admin Routes 
  if (path.startsWith('/admin')) {
    if (!user) return redirectWithCookies(new URL('/login', request.url))
    if (userProfile?.role !== 'admin') {
      return redirectWithCookies(new URL('/dashboard', request.url))
    }
  }

  // 6. Protect Dashboard 🏠
  if (path.startsWith('/dashboard') && !user) {
    return redirectWithCookies(new URL('/login', request.url))
  }

  // 7. Public Route Redirects
  if (path === '/login' && user) {
    return redirectWithCookies(new URL('/dashboard', request.url))
  }

  // 8. Apply Security Headers (The Iron Dome) 
  // We apply these LAST to ensure they are not wiped out by Supabase auth logic
  const isDev = process.env.NODE_ENV === 'development'
  const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  ${!isDev ? 'upgrade-insecure-requests;' : ''}
  connect-src 'self' https://*.supabase.co https://*.supabase.in;
`

const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
 
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (🟢 IMPORTANT: Exclude the auth folder from middleware logic)
     * - Public images
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
