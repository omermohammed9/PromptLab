'use client'

import { useState, useRef, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { 
  Download, LogIn, LogOut, 
  ChevronDown 
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher'
import { NavbarProps } from '@/types/interface'
import toast from 'react-hot-toast'
import { exportVaultToJSON } from '@/utils/exportHelper'
import { useLogout } from '@/hooks/useLogout'
import { useTranslations } from 'next-intl'

export default function Navbar({ session, userPrompts }: NavbarProps) {
  const t = useTranslations('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const { handleLogout } = useLogout() 
  
  // Safe cast for User Metadata
  const user = session?.user as { 
    email?: string;
    user_metadata?: { 
      avatar_url?: string; 
      full_name?: string 
    } 
  }
  const avatarUrl = user?.user_metadata?.avatar_url
  const email = user?.email
  const initial = email ? email[0].toUpperCase() : 'U'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 🟢 CLEAN EXPORT HANDLER
  const handleExport = () => {
    // We do NOT check for empty vault here. 
    // Your 'exportVaultToJSON' function already checks that and shows the toast.
    exportVaultToJSON(userPrompts)
    
    // Just close the menu
    setIsMenuOpen(false)
  }

  // 🟢 CLEAN LOGOUT HANDLER
  const onLogoutClick = async () => {
    // We do NOT handle localStorage clearing here.
    // 'handleLogout' calls 'globalSignOut', which handles cookies/storage/redirects.
    setIsMenuOpen(false)
    toast.loading("Signing out...", { id: 'logout' })
    
    try {
      await handleLogout()
      // No need to redirect here; globalSignOut does it.
    } catch (e) {
      console.error("Logout failed", e)
    }
    toast.dismiss('logout')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-[background-color,border-color,backdrop-filter]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between relative z-20">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
            P
          </div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {t('title')}
          </h1>
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          {session ? (
            <div className="relative" ref={menuRef}>
              
              {/* Trigger */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 ps-1 pe-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="User" width={32} height={32} className="rounded-full border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {initial}
                  </div>
                )}
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {isMenuOpen && (
                <div className="absolute top-full end-0 mt-2 w-64 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden transform origin-top-end transition-all animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user?.user_metadata?.full_name || 'Prompt Engineer'}
                    </p>
                    <p className="text-xs text-slate-500 truncate font-mono">
                        {email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        My Vault
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
                    >
                        <Download size={16} />
                        Export Data ({userPrompts.length})
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    <button 
                        onClick={onLogoutClick}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                    >
                        <LogOut size={16} />
                        {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <LogIn size={16} /> 
              <span className="hidden xs:inline">{t('login')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}