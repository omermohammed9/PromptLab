'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, Check, Globe, Lock, Trash2, Wand2, Clock, Heart, Loader2
} from 'lucide-react'
import { Prompt } from '@/types/interface'
import ExpandableText from '@/components/ui/ExpandableText'
import toast from 'react-hot-toast'
import PromptReasoning from './PromptReasoning'

interface PromptCardProps {
  prompt: Prompt
  index?: number
  isPublicView?: boolean
  actions?: {
    onTogglePublic?: (id: string, current: boolean) => void
    onDelete?: (id: string, title: string) => void
    onRemix?: (content: string, id: string) => Promise<void>
    onLike?: (id: string) => Promise<any>
  }
}

type ActionType = 'like' | 'remix' | 'toggle-public' | 'delete' | 'copy' | null

export default function PromptCard({ 
  prompt: p, 
  index = 0, 
  isPublicView = true, 
  actions 
}: PromptCardProps) {
  
  const [copied, setCopied] = useState(false)
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  
  // 💖 Optimistic UI State
  const [isLiked, setIsLiked] = useState(p.is_liked || false)
  const [likesCount, setLikesCount] = useState(p.likes_count || 0)
  const [remixCount, setRemixCount] = useState(p.remix_count || 0)
  
  // Logic to determine if card should span 2 columns (Mosaic effect)
  const isWide = index % 7 === 0 || index % 7 === 4
  const isPending = p.status === 'pending'
  const isBusy = activeAction !== null || isPending

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isBusy) return
    
    setActiveAction('copy')
    navigator.clipboard.writeText(p.content)
    setCopied(true)
    toast.success("Prompt copied!")
    
    setTimeout(() => {
      setCopied(false)
      setActiveAction(null)
    }, 2000)
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actions?.onLike || isBusy) return

    setActiveAction('like')
    const prevIsLiked = isLiked
    const prevCount = likesCount

    // Optimistic Update
    const newIsLiked = !prevIsLiked
    setIsLiked(newIsLiked)
    setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1))

    try {
      await actions.onLike(p.id)
    } catch (err) {
      setIsLiked(prevIsLiked)
      setLikesCount(prevCount)
      toast.error("Failed to update like")
    } finally {
      setActiveAction(null)
    }
  }

  const handleRemix = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actions?.onRemix || isBusy) return

    setActiveAction('remix')
    
    // Optimistic Update (UI count)
    setRemixCount(prev => prev + 1)
    
    toast.success("Prompt sent to workbench!", { 
      icon: '🎨',
      style: {
        borderRadius: '12px',
        background: '#333',
        color: '#fff',
      }
    })

    try {
      await actions.onRemix(p.content, p.id)
    } catch (err) {
      setRemixCount(prev => Math.max(0, prev - 1))
      toast.error("Failed to track remix")
    } finally {
      setActiveAction(null)
    }
  }

  const handleTogglePublic = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actions?.onTogglePublic || isBusy) return
    
    setActiveAction('toggle-public')
    try {
      await actions.onTogglePublic(p.id, p.is_public)
    } catch (err) {
      // Error handled by parent
    } finally {
      setActiveAction(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actions?.onDelete || isBusy) return
    
    setActiveAction('delete')
    try {
      await actions.onDelete(p.id, p.title || "Untitled")
    } catch (err) {
      // Error handled by parent
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        group relative bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm 
        hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/60 hover:border-blue-200 dark:hover:border-blue-900/50 
        transition-all duration-500 flex flex-col h-full
        ${isWide ? 'lg:col-span-2 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50' : ''}
      `}
    >
      
      {/* 🟢 TOOLBAR */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl">
        
        <ActionButton 
          onClick={handleCopy}
          icon={copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          isLoading={activeAction === 'copy'}
          hoverColor="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          tooltip={copied ? "Copied!" : "Copy to clipboard"}
          ariaLabel="Copy prompt content"
        />

        {actions?.onLike && (
          <ActionButton 
            onClick={handleLike}
            icon={<Heart size={16} className={isLiked ? "fill-red-500 text-red-500" : ""} />}
            isLoading={activeAction === 'like'}
            isActive={isLiked}
            activeColor="text-red-500 bg-red-50 dark:bg-red-900/20"
            hoverColor="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            tooltip={isLiked ? "Unlike" : "Like"}
            ariaLabel={isLiked ? "Unlike prompt" : "Like prompt"}
          />
        )}

        {(actions || !isPublicView) && <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />}

        {!isPublicView && actions && (
          <>
            <ActionButton 
              onClick={handleTogglePublic}
              icon={isPending ? <Clock size={16} /> : p.is_public ? <Globe size={16} /> : <Lock size={16} />}
              isLoading={activeAction === 'toggle-public'}
              isActive={p.is_public || isPending}
              activeColor={isPending 
                ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30" 
                : "text-blue-500 bg-blue-50 dark:bg-blue-900/30"}
              disabled={isPending}
              tooltip={isPending ? "Review in progress" : p.is_public ? "Make Private" : "Make Public"}
              ariaLabel={p.is_public ? "Make prompt private" : "Make prompt public"}
            />
            <ActionButton 
              onClick={handleDelete}
              icon={<Trash2 size={16} />}
              isLoading={activeAction === 'delete'}
              hoverColor="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              tooltip="Delete prompt"
              ariaLabel="Delete prompt"
            />
          </>
        )}

        {actions?.onRemix && (
           <ActionButton 
             onClick={handleRemix}
             icon={<Wand2 size={16} />}
             isLoading={activeAction === 'remix'}
             hoverColor="hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
             tooltip="Remix this prompt"
             ariaLabel="Remix this prompt"
           />
        )}
      </div>

      {/* 🟢 HEADER */}
      <div className="mb-5 pr-10"> 
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {p.tags?.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              #{t}
            </span>
          ))}
          
          <div className="flex items-center gap-3 ml-auto">
            {likesCount > 0 && (
              <motion.span 
                initial={false}
                animate={{ scale: activeAction === 'like' ? [1, 1.2, 1] : 1 }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500"
              >
                <Heart size={12} className={isLiked ? "fill-red-400 text-red-400" : ""} />
                {likesCount}
              </motion.span>
            )}
            {remixCount > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                <Wand2 size={12} />
                {remixCount}
              </span>
            )}
          </div>
          
          {!isPublicView && (
             <div className="flex items-center">
                {isPending ? (
                   <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30 flex items-center gap-1">
                     <Clock size={10} className="animate-pulse" /> Reviewing
                   </span>
                ) : (
                   <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                     p.is_public 
                      ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' 
                      : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-800'
                   }`}>
                     {p.is_public ? 'Public' : 'Private'}
                   </span>
                )}
             </div>
          )}
        </div>
        <h3 className={`font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isWide ? 'text-2xl' : 'text-xl'}`}>
          {p.title || "Untitled Prompt"}
        </h3>
      </div>

      {/* 🟢 CONTENT */}
      <div className="flex-1 relative rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-800/50 group-hover:border-blue-100 dark:group-hover:border-blue-900/20 transition-all duration-300 overflow-hidden">
        <ExpandableText text={p.content} isWide={isWide} variant="content" />
      </div>

      {/* 🟢 FOOTER */}
      {p.explanation && (
         <div className="mt-5">
            <PromptReasoning text={p.explanation} variant="slate" />
         </div>
      )}
    </motion.div>
  )
}

interface ActionButtonProps {
  onClick: (e: React.MouseEvent) => void
  icon: React.ReactNode
  isActive?: boolean
  isLoading?: boolean
  activeColor?: string
  hoverColor?: string
  disabled?: boolean
  tooltip: string
  ariaLabel: string
}

const ActionButton = ({ 
  onClick, 
  icon, 
  isActive, 
  isLoading, 
  activeColor, 
  hoverColor, 
  disabled, 
  tooltip,
  ariaLabel
}: ActionButtonProps) => (
  <button 
    disabled={disabled || isLoading}
    onClick={onClick}
    aria-label={ariaLabel}
    aria-disabled={disabled || isLoading}
    className={`
      w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 active:scale-95 touch-manipulation
      ${isActive ? activeColor : `text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${hoverColor || ''}`}
      ${(disabled || isLoading) ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
    `}
    title={disabled || isLoading ? "" : tooltip}
  >
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
        >
          <Loader2 size={16} className="animate-spin" />
        </motion.div>
      ) : (
        <motion.div
          key="icon"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      )}
    </AnimatePresence>
  </button>
)