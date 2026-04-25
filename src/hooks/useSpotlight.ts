import { useState, useEffect, useCallback } from 'react'
import { supabaseclient } from '@/lib/supabase/client'
import { generateTip } from '@/app/dashboard/action' // 👈 This now handles DB saving!
import toast from 'react-hot-toast'

const FALLBACK_TIP = {
  id: 'system-fallback',
  title: 'Pro Tip: Be Specific',
  content: 'To get the best results from AI, assign a specific persona (e.g., "Act as a Senior React Engineer") and clearly define the desired output format.',
  explanation: 'Assigning a persona primes the AI context window with domain-specific vocabulary and patterns.',
  tags: ['basics', 'prompt-engineering'],
  created_at: new Date().toISOString()
}

export function useSpotlight() {
  const [tip, setTip] = useState<any>(null)
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
      let { data } = await supabaseclient
        .from('prompts')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'approved')
        .contains('tags', ['tip'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setTip(data || FALLBACK_TIP)
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
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to generate tip")
    } finally {
      setLoading(false)
    }
  }

  // Initialize
  useEffect(() => {
    checkAdminStatus()
    refreshTip()
  }, [checkAdminStatus, refreshTip])

  return {
    tip,
    loading,
    isAdmin,
    generateNewTip
  }
}