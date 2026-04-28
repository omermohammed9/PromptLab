import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  // 1. Handle i18n Routing
  const intlResponse = intlMiddleware(request)
  
  // 2. Initialize Response
  let response = intlResponse || NextResponse.next({
    request: { headers: request.headers },
  })

  const pathname = request.nextUrl.pathname
  const cleanPath = getPathWithoutLocale(pathname)
  const localePrefix = pathname.split('/')[1]
  const currentLocale = routing.locales.includes(localePrefix as any) ? localePrefix : 'en'

  // 🚨 FAILSAFE: Catch orphaned Supabase auth codes on the homepage
  const code = request.nextUrl.searchParams.get('code')
  const isHomepage = cleanPath === '/'
  
  if (code && isHomepage) {
    const callbackUrl = new URL(`/${currentLocale}/auth/callback`, request.url)
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('next', `/${currentLocale}/dashboard`)
    return NextResponse.redirect(callbackUrl)
  }

  // 3. Define which routes need Auth logic
  const authRequiredRoutes = ['/dashboard', '/admin', '/login']
  const needsAuth = authRequiredRoutes.some(route => cleanPath.startsWith(route))

  if (!needsAuth) {
    // Return early for public pages like /privacy, /terms, etc.
    // Still apply security headers at the end if needed, but skip Supabase overhead
    return applySecurityHeaders(response)
  }

  // 4. Supabase Client Setup
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // 5. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser()

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
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // 6. Banned User Check 
  if (userProfile?.is_banned) {
    await supabase.auth.signOut()
    return redirectWithCookies(new URL(`/${currentLocale}/banned`, request.url))
  }

  // 7. Protect Admin Routes 
  if (cleanPath.startsWith('/admin')) {
    if (!user) return redirectWithCookies(new URL(`/${currentLocale}/login`, request.url))
    if (userProfile?.role !== 'admin') {
      return redirectWithCookies(new URL(`/${currentLocale}/dashboard`, request.url))
    }

    const whitelist = process.env.ADMIN_IP_WHITELIST
    if (whitelist) {
      const allowedIps = whitelist.split(',').map(ip => ip.trim())
      const requesterIp = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      
      const isAllowed = allowedIps.includes(requesterIp) || 
                       (requesterIp === '127.0.0.1' && allowedIps.includes('::1')) ||
                       (process.env.NODE_ENV === 'development')

      if (!isAllowed) {
        console.warn(`Blocked admin access to ${pathname} from unauthorized IP: ${requesterIp}`)
        return redirectWithCookies(new URL(`/${currentLocale}/dashboard`, request.url))
      }
    }
  }

  // 8. Protect Dashboard 🏠
  if (cleanPath.startsWith('/dashboard') && !user) {
    return redirectWithCookies(new URL(`/${currentLocale}/login`, request.url))
  }

  // 9. Public Route Redirects
  if (cleanPath === '/login' && user) {
    return redirectWithCookies(new URL(`/${currentLocale}/dashboard`, request.url))
  }

  return applySecurityHeaders(response)
}

function getPathWithoutLocale(path: string) {
  const parts = path.split('/')
  if (routing.locales.includes(parts[1] as any)) {
    return '/' + parts.slice(2).join('/')
  }
  return path
}

function applySecurityHeaders(response: NextResponse) {
  const isDev = process.env.NODE_ENV === 'development'
  
  // CSP Refined for Next.js + Supabase + Genkit
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    ${!isDev ? 'upgrade-insecure-requests;' : ''}
    connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.openai.com https://api.groq.com https://api-inference.huggingface.co;
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
    '/((?!api|_next|_static|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
export default proxy;

