'use client'

import { FeedProps } from '@/types/interface'
import PromptCard from './PromptCard' // 👈 Reuse the premium card

export default function Feed({ prompts }: FeedProps) {

  // Empty State
  if (!prompts || prompts.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
        <p className="text-slate-500 font-medium">No prompts found.</p>
        <p className="text-xs text-slate-400 mt-1">Be the first to publish one!</p>
      </div>
    )
  }

  // Grid Layout
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {prompts.map((p, index) => (
        <PromptCard 
          key={p.id} 
          prompt={p} 
          index={index}
          isPublicView={false} // Defaults to simple view since 'actions' aren't passed
        />
      ))}
    </div>
  )
}