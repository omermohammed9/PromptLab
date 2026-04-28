'use client'

import { Lightbulb, Sparkles, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface PromptReasoningProps {
  text: string
  variant?: 'blue' | 'amber' | 'slate'
}

export default function PromptReasoning({ text, variant = 'blue' }: PromptReasoningProps) {
  const isReducedMotion = useReducedMotion()
  if (!text) return null

  // 1. ✨ CLEANUP: Remove redundant prefixes from AI (e.g., "Logic: ...")
  const cleanText = text.replace(/^(Logic|Explanation|Reasoning):\s*/i, '')

  const styles = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      icon: <AlertCircle size={18} className="shrink-0 mt-0.5" />,
      label: 'AI Reasoning',
      labelColor: 'text-blue-700 dark:text-blue-300'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-500',
      icon: <Lightbulb size={18} className="shrink-0 mt-0.5" />,
      label: 'Pro Tip Logic',
      labelColor: 'text-amber-800 dark:text-amber-400 font-extrabold'
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-800/50',
      border: 'border-slate-100 dark:border-slate-700',
      iconColor: 'text-slate-500',
      icon: <Sparkles size={18} className="shrink-0 mt-0.5" />,
      label: 'Explanation',
      labelColor: 'text-slate-600 dark:text-slate-300'
    }
  }

  const style = styles[variant]

  return (
    <motion.div 
      initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      // 2. ✨ TWEAK: Reduced p-4 to p-3 for a cleaner fit in Spotlight
      // Removed 'my-4' so the Parent component controls the spacing
      className={`flex items-start gap-3 p-3 rounded-xl border ${style.bg} ${style.border}`}
    >
      <div className={style.iconColor}>
        {style.icon}
      </div>
      <div className="space-y-1">
        <span className={`text-xs font-bold uppercase tracking-wider ${style.labelColor}`}>
          {style.label}
        </span>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {cleanText} {/* 👈 Uses the clean text now */}
        </p>
      </div>
    </motion.div>
  )
}