import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Handle i18n Routing
  // The intlMiddleware handles locale detection and redirects (e.g. / -> /en)
  const intlResponse = intlMiddleware(request)
  
  // If intlMiddleware wants to redirect (e.g. adding a locale prefix), return its response
  // But we need to be careful not to break the Supabase logic if it's a redirect.
  // Actually, next-intl usually returns a response with headers/cookies.
  
  // 2. Initialize Response (combining with intlResponse if it exists)
  let response = intlResponse || NextResponse.next({
    request: { headers: request.headers },
  })

  // 🚨 FAILSAFE: Catch orphaned Supabase auth codes on the homepage
  // If Supabase ignores the redirect URL and dumps the user on the homepage with a code,
  // we manually route them to the callback handler so they get logged in.
  const code = request.nextUrl.searchParams.get('code')
  const pathname = request.nextUrl.pathname
  
  // Adjusted for locale-based paths (e.g., /en or /ar)
  const isHomepage = pathname === '/' || routing.locales.some(locale => pathname === `/${locale}`)
  
  if (code && isHomepage) {
    const locale = pathname === '/' ? 'en' : pathname.split('/')[1]
    const callbackUrl = new URL(`/${locale}/auth/callback`, request.url)
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('next', `/${locale}/dashboard`)
    return NextResponse.redirect(callbackUrl)
  }

  // 3. Supabase Client Setup
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          //  This line resets the response, so we must set headers AFTER this block
          // We preserve the intlResponse headers if any
          const newResponse = NextResponse.next({ request: { headers: request.headers } })
          response.headers.forEach((value, key) => {
            newResponse.headers.set(key, value)
          })
          response = newResponse
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 4. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Helper to check path without locale prefix
  const getPathWithoutLocale = (path: string) => {
    const parts = path.split('/')
    if (routing.locales.includes(parts[1] as any)) {
      return '/' + parts.slice(2).join('/')
    }
    return path
  }

  const cleanPath = getPathWithoutLocale(path)
  const localePrefix = path.split('/')[1]
  const currentLocale = routing.locales.includes(localePrefix as any) ? localePrefix : 'en'

  let userProfile = null

  // Only fetch profile if user exists AND we are on a protected route
  if (user && (cleanPath.startsWith('/dashboard') || cleanPath.startsWith('/admin'))) {
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

  // 5. Banned User Check 
  if (userProfile?.is_banned) {
    await supabase.auth.signOut()
    return redirectWithCookies(new URL(`/${currentLocale}/banned`, request.url))
  }

  // 6. Protect Admin Routes 
  if (cleanPath.startsWith('/admin')) {
    // A. Role Check
    if (!user) return redirectWithCookies(new URL(`/${currentLocale}/login`, request.url))
    if (userProfile?.role !== 'admin') {
      return redirectWithCookies(new URL(`/${currentLocale}/dashboard`, request.url))
    }

    // B. IP Whitelist Check (Enterprise Security)
    const whitelist = process.env.ADMIN_IP_WHITELIST
    if (whitelist) {
      const allowedIps = whitelist.split(',').map(ip => ip.trim())
      const requesterIp = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      
      const isAllowed = allowedIps.includes(requesterIp) || 
                       (requesterIp === '127.0.0.1' && allowedIps.includes('::1')) ||
                       (process.env.NODE_ENV === 'development')

      if (!isAllowed) {
        console.warn(`Blocked admin access to ${path} from unauthorized IP: ${requesterIp}`)
        return redirectWithCookies(new URL(`/${currentLocale}/dashboard`, request.url))
      }
    }
  }

  // 7. Protect Dashboard 🏠
  if (cleanPath.startsWith('/dashboard') && !user) {
    return redirectWithCookies(new URL(`/${currentLocale}/login`, request.url))
  }

  // 8. Public Route Redirects
  if (cleanPath === '/login' && user) {
    return redirectWithCookies(new URL(`/${currentLocale}/dashboard`, request.url))
  }

  // 9. Apply Security Headers (The Iron Dome) 
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
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_static (inside /public)
    // - /_vercel (Vercel internals)
    // - Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
    '/((?!api|_next|_static|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
