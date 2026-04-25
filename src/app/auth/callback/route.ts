import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'

  // Open Redirect validation: ensure `next` is a local path
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard'
  }

  // If no code, something is wrong, go to login
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no-code`)
  }

  /* We don't create the response yet. 
     We create a "dummy" response to capture cookies during the exchange.
  */
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Update request cookies for current execution
            request.cookies.set(name, value)
            // Update response cookies for the browser
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ⚡️ Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (!error) {
    // 🟢 SUCCESS: Now create the ACTUAL redirect response 
    // and transfer the cookies we captured in our dummy 'response'
    const finalResponse = NextResponse.redirect(`${origin}${next}`)
    
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value)
    })

    return finalResponse
  }

  // 🔴 FAIL: Log the specific error for debugging
  console.error("Auth Exchange Error:", error.message)
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}