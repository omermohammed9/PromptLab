'use client'

import { useRouter } from 'next/navigation'
import { supabaseclient } from '@/lib/supabase/client' // Use your existing client
import { ArrowRight, Lock, Rocket } from 'lucide-react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AuthButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'outline'
  icon?: 'rocket' | 'lock'
}

export default function AuthButton({ label, variant = 'primary', icon }: AuthButtonProps) {
  const router = useRouter()
  const isReducedMotion = useReducedMotion()

  const handleNavigation = async () => {
    // 1. Check Session
    const { data: { session } } = await supabaseclient.auth.getSession()

    // 2. Route Logic
    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/login') // Login page should redirect to dashboard after success
    }
  }

  const baseStyle = `flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${!isReducedMotion ? 'active:scale-95' : ''}`
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40",
    secondary: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100",
    outline: "border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-600 dark:text-slate-300"
  }

  return (
    <button onClick={handleNavigation} className={`${baseStyle} ${variants[variant]}`}>
      {icon === 'rocket' && <Rocket size={18} />}
      {icon === 'lock' && <Lock size={18} />}
      {label}
      {variant === 'primary' && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
    </button>
  )
}