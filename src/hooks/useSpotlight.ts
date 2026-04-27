import { useState, useEffect, useCallback } from 'react'
import { supabaseclient } from '@/lib/supabase/client'
import { generateTip } from '@/app/[locale]/dashboard/action' // 👈 This now handles DB saving!
import toast from 'react-hot-toast'

const FALLBACK_TIP = {
  id: 'system-fallback',
  title: 'Pro Tip: Be Specific',
  content: 'To get the best results from AI, assign a specific persona (e.g., "Act as a Senior React Engineer") and clearly define the desired output format.',
  explanation: 'Assigning a persona primes the AI context window with domain-specific vocabulary and patterns.',
  tags: ['basics', 'prompt-engineering'],
  is_public: true,
  user_id: 'system',
  status: 'approved' as const,
  created_at: new Date().toISOString()
}

import { Prompt } from '@/types/interface'

export function useSpotlight() {
  const [tip, setTip] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // 1. Check Admin Status
  const checkAdminStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabaseclient.auth.getUser()
      if (user) {
        const { data: profile } = await supabaseclient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profile?.role === 'admin') setIsAdmin(true)
      }
    } catch (e) {
      console.error("Admin check failed", e)
    }
  }, [])

  // 2. Fetch Latest Tip (Read-only, safe for client)
  const refreshTip = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch the single most recent public tip
      const { data } = await supabaseclient
        .from('prompts')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'approved')
        .contains('tags', ['tip'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setTip(data || (FALLBACK_TIP as unknown as Prompt))
    } catch (e) {
      console.error("Tip fetch error", e)
      setTip(FALLBACK_TIP)
    } finally {
      setLoading(false)
    }
  }, [])

  // 3. Generate New Tip Action (The Clean Version)
  const generateNewTip = async () => {
    setLoading(true)
    try {
      // 🟢 ARCHITECTURE FIX: 
      // We do NOT save to DB here. We just call the Server Action.
      // The server generates AI, checks Admin, saves to DB, and returns the finished object.
      const newTip = await generateTip() 

      if (newTip) {
        setTip(newTip)
        toast.success("New Tip Generated!")
      }
    } catch (e: unknown) {
      console.error(e)
      const message = e instanceof Error ? e.message : "Failed to generate tip"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Initialize
  useEffect(() => {
    const init = async () => {
      await checkAdminStatus()
      await refreshTip()
    }
    init()
  }, [checkAdminStatus, refreshTip])

  return {
    tip,
    loading,
    isAdmin,
    generateNewTip
  }
}