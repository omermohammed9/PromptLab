'use client'
import { useEffect, useState } from 'react'
import { supabaseclient } from '@/lib/supabase/client'
import { Link } from '@/i18n/routing'
import { Shield } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function AdminSwitch() {
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  
  // Check if we are on dashboard or workbench to avoid overlap with CTAs
  const isOverlappingPage = pathname.includes('/dashboard') || pathname.includes('/workbench')

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabaseclient.auth.getUser()
      if (user) {
        // We check the DB role, not just the local session
        const { data } = await supabaseclient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (data?.role === 'admin') {
          setIsAdmin(true)
        }
      }
    }
    checkRole()
  }, [])

  if (!isAdmin) return null // Render nothing for regular users

  return (
    <Link 
      href="/admin" 
      className={`
        fixed ${isOverlappingPage ? 'bottom-24' : 'bottom-6'} end-6 
        z-admin-switch flex items-center gap-2 
        bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-full 
        shadow-lg shadow-indigo-900/40 transition-all hover:scale-105 font-bold 
        animate-in fade-in slide-in-from-bottom-4
      `}
      aria-label="Open Admin Console"
    >
      <Shield size={20} className="fill-white/20" />
      <span>Admin Console</span>
    </Link>
  )
}