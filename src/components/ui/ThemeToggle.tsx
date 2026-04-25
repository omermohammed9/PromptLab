'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 1. Avoid Hydration Mismatch (wait until client loads)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <div className="w-10 h-10" />
  }

  // 2. Logic: Check 'resolvedTheme' to handle 'system' preference correctly
  const isDark = resolvedTheme === 'dark'

  return (
    <button 
      onClick={() => setTheme(isDark ? 'light' : 'dark')} 
      className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-yellow-400 transition-all hover:scale-110 active:scale-95 border border-slate-200 dark:border-slate-700"
      title="Toggle Dark Mode"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}