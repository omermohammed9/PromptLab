'use client'

import { useSpotlight } from '@/hooks/useSpotlight' 
import { RefreshCw, Sparkles, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PromptReasoning from './PromptReasoning' 

export default function Spotlight() {
  const { tip, loading, isAdmin, generateNewTip } = useSpotlight()
  const displayId = tip?.id?.toString().slice(0,4) || '000'

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      // 1. FIX: Reduced bottom margin (mb-12 -> mb-8) for tighter layout
      className="relative group rounded-2xl p-[1px] mb-8 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
      
      {/* 2. FIX: Adjusted padding (p-6 -> p-5 md:p-6) for better mobile fit */}
      <div className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-amber-500/5">
        
        {/* --- Header --- */}
        {/* 3. FIX: Reduced header margin (mb-6 -> mb-4) so it connects to content */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Lightbulb size={18} /> {/* Slightly smaller icon */}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-wide uppercase flex items-center gap-2">
                Pro Tip <span className="text-amber-500">#{displayId}</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                 {loading ? "Updating..." : "AI-Generated • Live Update"}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <button 
              onClick={generateNewTip} 
              disabled={loading}
              // 4. FIX: Tighter button styling
              className="group/btn bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 text-slate-600 hover:text-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
              <span>New</span>
            </button>
          )}
        </div>

        {/* --- Content Area --- */}
        <AnimatePresence mode='wait'>
          {loading ? (
             <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ) : (
            <motion.div 
              key={tip?.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              // 5. FIX: Added space-y-4 to handle vertical rhythm between Text -> Box -> Tags
              className="space-y-4"
            >
              {/* 6. FIX: Typography Scaling (text-lg -> text-base). Makes it look less "shouty" */}
              <div className="text-base md:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {tip?.content}
              </div>
              
              {/* Reasoning Box - This will now align perfectly with the new PromptReasoning component */}
              {tip?.explanation && (
                <PromptReasoning text={tip.explanation} variant="amber" />
              )}

              {/* Tags */}
              <div className="flex items-center gap-2 pt-1">
                  {tip?.tags?.map((tag: string) => (
                    // 7. FIX: Subtle tag styling (border instead of heavy background)
                    <span key={tag} className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                      #{tag}
                    </span>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}