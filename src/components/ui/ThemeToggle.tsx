'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const t = useTranslations('common')
  const [mounted, setMounted] = useState(false)
  const isReducedMotion = useReducedMotion()

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button 
      onClick={() => setTheme(isDark ? 'light' : 'dark')} 
      className={`p-3 md:p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-yellow-400 transition-[transform,background-color,color,border-color] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${!isReducedMotion ? 'hover:scale-110 active:scale-95' : ''}`}
      title={t('toggle_theme')}
      aria-label={t('toggle_theme')}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}