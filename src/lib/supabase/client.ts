import { createBrowserClient } from '@supabase/ssr'

export const createSupaClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const supabaseclient = createSupaClient()