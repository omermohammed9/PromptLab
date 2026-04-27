'use client'

import { useState } from 'react'
import { supabaseclient } from '@/lib/supabase/client'
import { Check, X, Loader2, Flag, AlertCircle, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

interface Report {
  id: string
  created_at: string
  prompt_id: string
  reporter_id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  prompts: {
    content: string
    title: string
  }
}

export default function ReportsQueue() {
  const t = useTranslations('reports')
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const { data, error } = await supabaseclient
        .from('reports')
        .select('*, prompts(title, content)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Reports Fetch Error:", error)
        return []
      }
      return data as Report[]
    }
  })

  const resolveMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string, decision: 'resolved' | 'dismissed' }) => {
      const { error } = await supabaseclient
        .from('reports')
        .update({ status: decision })
        .eq('id', id)
      
      if (error) throw error
    },
    onMutate: ({ id }) => setProcessingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      toast.success(t('report_handled'))
    },
    onError: () => toast.error(t('failed_update_report')),
    onSettled: () => setProcessingId(null)
  })

  const deletePromptMutation = useMutation({
    mutationFn: async ({ promptId, reportId }: { promptId: string, reportId: string }) => {
      // 1. Delete the prompt
      const { error: pError } = await supabaseclient
        .from('prompts')
        .delete()
        .eq('id', promptId)
      
      if (pError) throw pError

      // 2. Resolve the report
      const { error: rError } = await supabaseclient
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId)
      
      if (rError) throw rError
    },
    onMutate: ({ reportId }) => setProcessingId(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-prompts'] })
      toast.success(t('content_removed_resolved'))
    },
    onError: () => toast.error(t('action_failed')),
    onSettled: () => setProcessingId(null)
  })

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4">
      <Loader2 className="animate-spin text-amber-500" size={32} />
      <span className="text-sm font-bold uppercase tracking-widest animate-pulse">{t('loading_reports')}</span>
    </div>
  )

  if (reports.length === 0) return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-16 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30"
    >
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
        <Check className="text-emerald-500" size={32} />
      </div>
      <p className="font-black text-xl text-slate-200 mb-2">{t('no_active_reports')}</p>
      <p className="text-sm text-slate-500 text-center max-w-xs">{t('community_behaving')}</p>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {reports.map((report) => (
          <motion.div 
            layout
            key={report.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col md:flex-row gap-8 justify-between items-start transition-all group shadow-xl"
          >
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 uppercase tracking-widest">
                    <Flag size={12} className="text-amber-500" />
                    {t('report_id', { id: report.id.slice(0,8) })}
                 </span>
                 <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full border border-red-500/20 flex items-center gap-1.5 uppercase tracking-widest">
                    <AlertCircle size={12} /> {t('pending_action')}
                 </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('reason_for_report')}</p>
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-200 text-sm font-medium">
                  &quot;{report.reason}&quot;
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('flagged_content')}</p>
                <div className="p-4 bg-slate-950 rounded-2xl text-slate-300 text-sm border border-slate-800/50 italic">
                  {report.prompts?.content || t('content_not_found')}
                </div>
              </div>
              
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Loader2 size={10} /> {t('reported', { date: new Date(report.created_at).toLocaleString() })}
              </div>
            </div>
            
            <div className="flex gap-3 shrink-0 w-full md:w-auto">
              <button 
                onClick={() => resolveMutation.mutate({ id: report.id, decision: 'dismissed' })}
                disabled={processingId !== null}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded-2xl border border-slate-800 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                {processingId === report.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                {t('dismiss')}
              </button>
              <button 
                onClick={() => deletePromptMutation.mutate({ promptId: report.prompt_id, reportId: report.id })}
                disabled={processingId !== null}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-900/20 transition-all text-xs font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                {processingId === report.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {t('delete_content')}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
