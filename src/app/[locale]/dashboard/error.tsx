'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function Error({ error, reset }: { error: Error, reset: () => void }) {
  useEffect(() => { console.error('Dashboard Error:', error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 p-6 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
        System Glitch Detected
      </h2>
      
      <p className="max-w-md mb-8 text-sm leading-relaxed">
        Our AI engine encountered an unexpected resistance. It might be a momentary connection issue.
      </p>

      <button 
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl"
      >
        <RefreshCcw size={18} />
        Reboot Workspace
      </button>
    </div>
  )
}