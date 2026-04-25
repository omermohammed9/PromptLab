'use client'
import { useState, useEffect } from 'react'
import { supabaseclient } from '@/lib/supabase/client'
import { Check, X, Loader2, MessageSquare, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { PromptItem } from '@/types/types'
import { moderatePromptAction } from '@/app/admin/action'

export default function ModerationQueue() {
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingPrompts()
  }, [])

  const fetchPendingPrompts = async () => {
    setLoading(true)
    const { data, error } = await supabaseclient
      .from('prompts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error("Error fetching prompts:", error)
      toast.error("Failed to fetch queue")
    } else if (data) {
      setPrompts(data as PromptItem[])
    }
    setLoading(false)
  }

  const handleModeration = async (id: string, decision: 'approved' | 'rejected') => {
    if (processingId) return
    
    setProcessingId(id)
    try {
      await moderatePromptAction(id, decision)
      // Remove from UI after success
      setPrompts(current => current.filter(p => p.id !== id))
      toast.success(decision === 'approved' ? "Prompt Published ✅" : "Prompt Rejected 🚫")
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <span className="text-sm font-bold uppercase tracking-widest animate-pulse">Scanning Queue...</span>
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
      <p className="font-black text-xl text-slate-200 mb-2">Queue is Empty</p>
      <p className="text-sm text-slate-500 text-center max-w-xs">All pending prompts have been reviewed. Great work!</p>
    </motion.div>
  )

  return (
    <div className="space-y-6">
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
                 <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 uppercase tracking-widest">
                   <AlertCircle size={12} /> Pending Review
                 </span>
              </div>
              
              <div className="p-5 bg-slate-950 rounded-2xl text-slate-300 text-base leading-relaxed border border-slate-800/50 font-medium selection:bg-blue-500/30">
                {prompt.content}
              </div>
              
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Loader2 size={10} /> Submitted: {new Date(prompt.created_at).toLocaleString()}
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
                Reject
              </button>
              <button 
                onClick={() => handleModeration(prompt.id, 'approved')}
                disabled={processingId !== null}
                aria-label="Approve prompt"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-900/20 hover:shadow-blue-600/40 transition-all text-xs font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === prompt.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Approve
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}