'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'
import Cookies from 'js-cookie'
import { useTranslations } from 'next-intl'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export default function CookieConsent() {
  const t = useTranslations('compliance')
  const [isVisible, setIsVisible] = useState(false)
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const consent = Cookies.get('cookie-consent')
    if (!consent) {
      // Delay slightly to not annoy the user immediately
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    Cookies.set('cookie-consent', 'accepted', { expires: 365 })
    setIsVisible(false)
  }

  const handleDecline = () => {
    Cookies.set('cookie-consent', 'declined', { expires: 365 })
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={isReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={isReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          className="fixed bottom-6 inset-x-6 z-[100] flex justify-center pointer-events-none"
          role="region"
          aria-label={t('cookie_banner_title')}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 md:p-8 max-w-2xl w-full pointer-events-auto flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Cookie size={32} aria-hidden="true" />
            </div>
            
            <div className="flex-1 text-center md:text-start">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {t('cookie_banner_title')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t('cookie_banner_desc')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleDecline}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {t('decline')}
              </button>
              <button
                onClick={handleAccept}
                className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('accept_all')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
