import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // 1. Await the cookie store
  const cookieStore = await cookies()

  // 2. Setup Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // 3. Verify User (Secure Method)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 4. Get IP Address
    let ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim()
    }

    // 🟢 5. DEV MODE FIX: Fake a real IP if we are on Localhost
    // This allows you to test the "Earthlink" and "Iraq" badges immediately.
    if (process.env.NODE_ENV === 'development' && (ip === '127.0.0.1' || ip === '::1')) {
       ip = '37.238.161.189' // Sample Earthlink IP from Iraq
    }

    // 6. Get Location Data
    const locationResponse = await fetch(`http://ip-api.com/json/${ip}`)
    const locationData = await locationResponse.json()

    // 7. Get Device Info
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // 8. Insert into Access Logs
    const { error } = await supabase.from('access_logs').insert({
      user_id: user.id, 
      ip_address: ip,
      location_data: locationData,
      user_agent: userAgent
    })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Security Log Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}