'use client'

import { useState } from 'react'
import { supabaseclient } from '@/lib/supabase/client'
import { Check, X, Loader2, MessageSquare, AlertCircle, Flag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { PromptItem } from '@/types/types'
import { moderatePromptAction, bulkApprovePromptsAction } from '@/app/[locale]/admin/action'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

export default function ModerationQueue() {
  const t = useTranslations('moderation')
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['admin', 'pending-prompts'],
    queryFn: async () => {
      const { data, error } = await supabaseclient
        .from('prompts')
        .select('*')
        .in('status', ['pending', 'flagged'])
        .order('created_at', { ascending: true })
        .limit(10)
      
      if (error) throw error
      return data as PromptItem[]
    }
  })

  const moderationMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string, decision: 'approved' | 'rejected' }) => 
      moderatePromptAction(id, decision),
    onMutate: ({ id }) => {
      setProcessingId(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-prompts'] })
      toast.success(t('moderation_success'))
    },
    onError: () => {
      toast.error(t('update_failed'))
    },
    onSettled: () => {
      setProcessingId(null)
    }
  })

  const bulkApproveMutation = useMutation({
    mutationFn: bulkApprovePromptsAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-prompts'] })
      toast.success(t('all_approved'))
    },
    onError: () => {
      toast.error(t('bulk_failed'))
    }
  })

  const handleModeration = (id: string, decision: 'approved' | 'rejected') => {
    moderationMutation.mutate({ id, decision })
  }

  const handleBulkApprove = () => {
    if (confirm(t('bulk_approve_confirm'))) {
      bulkApproveMutation.mutate()
    }
  }

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <span className="text-sm font-bold uppercase tracking-widest animate-pulse">{t('scanning_queue')}</span>
    </div>
  )

  if (prompts.length === 0) return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-16 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30"
    >
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
        <Check className="text-emerald-500" size={32} />
      </div>
      <p className="font-black text-xl text-slate-200 mb-2">{t('queue_empty')}</p>
      <p className="text-sm text-slate-500 text-center max-w-xs">{t('reviewed_all')}</p>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <MessageSquare className="text-blue-500" size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-widest">{t('active_queue')}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">{t('prompts_pending', { count: prompts.length })}</p>
          </div>
        </div>
        <button
          onClick={handleBulkApprove}
          disabled={bulkApproveMutation.isPending || prompts.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
        >
          {bulkApproveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {t('approve_all')}
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {prompts.map((prompt) => (
          <motion.div 
            layout
            key={prompt.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col md:flex-row gap-8 justify-between items-start transition-all group shadow-xl"
          >
            
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 uppercase tracking-widest">
                   <MessageSquare size={12} className="text-blue-500" />
                   ID: {prompt.id.slice(0,8)}
                 </span>
                 {prompt.status === 'flagged' ? (
                   <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full border border-red-500/20 flex items-center gap-1.5 uppercase tracking-widest">
                     <Flag size={12} /> {t('ai_flagged')}
                   </span>
                 ) : (
                   <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 uppercase tracking-widest">
                     <AlertCircle size={12} /> {t('pending_review')}
                   </span>
                 )}
              </div>

              {prompt.moderator_notes && (
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wide">
                  {t('ai_scan_result', { result: prompt.moderator_notes })}
                </div>
              )}
              
              <div className="p-5 bg-slate-950 rounded-2xl text-slate-300 text-base leading-relaxed border border-slate-800/50 font-medium selection:bg-blue-500/30">
                {prompt.content}
              </div>
              
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Loader2 size={10} /> {t('submitted', { date: new Date(prompt.created_at).toLocaleString() })}
              </div>
            </div>
            
            <div className="flex gap-3 shrink-0 w-full md:w-auto">
              <button 
                onClick={() => handleModeration(prompt.id, 'rejected')}
                disabled={processingId !== null}
                aria-label="Reject prompt"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-2xl border border-slate-800 hover:border-red-500/30 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === prompt.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                {t('reject')}
              </button>
              <button 
                onClick={() => handleModeration(prompt.id, 'approved')}
                disabled={processingId !== null}
                aria-label="Approve prompt"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-900/20 hover:shadow-blue-600/40 transition-all text-xs font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === prompt.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {t('approve')}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}