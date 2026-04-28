import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseclient } from '@/lib/supabase/client'
import { getUserVault } from '@/services/prompts'
import { Prompt, UserSession } from '@/types/interface'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  
  // State
  const [session, setSession] = useState<UserSession | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userPrompts, setUserPrompts] = useState<Prompt[]>([])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // 1. Get Session first (faster, handles memory state)
        const { data: { session: currentSession } } = await supabaseclient.auth.getSession()
        
        // 2. Get User (Required for security check)
        const { data: { user }, error } = await supabaseclient.auth.getUser()
        
        // 3. Handle No User
        if (error || !user) {
          if (requireAuth) router.replace('/login')
          else setLoading(false)
          return
        }

        // 4. Set Session
        if (mounted) {
           setSession({ user: { id: user.id, email: user.email } } as UserSession)
        }

        // 5. Parallel Fetching (Faster!)
        const [profileRes, vaultRes] = await Promise.all([
          supabaseclient.from('profiles').select('role').eq('id', user.id).single(),
          getUserVault()
        ])

        if (mounted) {
          if (profileRes.data?.role === 'admin') setIsAdmin(true)
          if (vaultRes) setUserPrompts(vaultRes)
        }

      } catch (e) {
        // Ignore "lock stole" errors - they are non-fatal race conditions during locale switches
        if (!(e instanceof Error && e.message.includes('lock'))) {
          console.error("Auth initialization failed", e)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    return () => { mounted = false } // Cleanup to prevent memory leaks
  }, [router, requireAuth])

  return { session, isAdmin, loading, userPrompts, setUserPrompts }
}