'use client'

import { diffWords } from 'diff'
import { motion } from 'framer-motion'

interface VisualDiffProps {
  oldText: string
  newText: string
}

export default function VisualDiff({ oldText, newText }: VisualDiffProps) {
  const differences = diffWords(oldText, newText)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" /> Added
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" /> Removed
        </div>
      </div>
      
      <div className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 font-mono text-sm md:text-base leading-relaxed selection:bg-blue-100 dark:selection:bg-blue-900/50">
        {differences.map((part, index) => (
          <motion.span 
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className={`
              ${part.added ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-0.5 rounded' : ''}
              ${part.removed ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 line-through px-0.5 rounded' : ''}
              ${!part.added && !part.removed ? 'text-slate-600 dark:text-slate-300' : ''}
            `}
          >
            {part.value}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
