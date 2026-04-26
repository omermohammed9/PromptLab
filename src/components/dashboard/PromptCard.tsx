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
import ParticleBurst from '@/components/ui/ParticleBurst'

interface PromptCardProps {
  prompt: Prompt
  index?: number
  isPublicView?: boolean
  actions?: {
    onTogglePublic?: (id: string, current: boolean) => void
    onDelete?: (id: string, title: string) => void
    onRemix?: (content: string, id: string) => Promise<void>
    onLike?: (id: string) => Promise<boolean>
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
  const [burst, setBurst] = useState<{ x: number, y: number } | null>(null)
  
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

    setBurst({ x: e.clientX, y: e.clientY })
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

    setBurst({ x: e.clientX, y: e.clientY })
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
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="group relative glass-card p-6 md:p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col shadow-2xl"
    >
      {burst && <ParticleBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />}
      
      {/* 🟢 TOOLBAR */}
      <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-20 bg-white/10 dark:bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl">
        
        <ActionButton 
          onClick={handleCopy}
          icon={copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          isLoading={activeAction === 'copy'}
          hoverColor="hover:text-blue-400 hover:bg-white/10"
          tooltip={copied ? "Copied!" : "Copy to clipboard"}
          ariaLabel="Copy prompt content"
        />

        {actions?.onLike && (
          <ActionButton 
            onClick={handleLike}
            icon={<Heart size={16} className={isLiked ? "fill-red-500 text-red-500" : ""} />}
            isLoading={activeAction === 'like'}
            isActive={isLiked}
            activeColor="text-red-500 bg-red-500/10"
            hoverColor="hover:text-red-500 hover:bg-red-500/10"
            tooltip={isLiked ? "Unlike" : "Like"}
            ariaLabel={isLiked ? "Unlike prompt" : "Like prompt"}
          />
        )}

        {(actions || !isPublicView) && <div className="w-px h-4 bg-white/10 mx-1" />}

        {!isPublicView && actions && (
          <>
            <ActionButton 
              onClick={handleTogglePublic}
              icon={isPending ? <Clock size={16} /> : p.is_public ? <Globe size={16} /> : <Lock size={16} />}
              isLoading={activeAction === 'toggle-public'}
              isActive={p.is_public || isPending}
              activeColor={isPending 
                ? "text-amber-400 bg-amber-400/10" 
                : "text-blue-400 bg-blue-400/10"}
              disabled={isPending}
              tooltip={isPending ? "Review in progress" : p.is_public ? "Make Private" : "Make Public"}
              ariaLabel={p.is_public ? "Make prompt private" : "Make prompt public"}
            />
            <ActionButton 
              onClick={handleDelete}
              icon={<Trash2 size={16} />}
              isLoading={activeAction === 'delete'}
              hoverColor="hover:text-red-500 hover:bg-red-500/10"
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
             hoverColor="hover:text-emerald-400 hover:bg-emerald-500/10"
             tooltip="Remix this prompt"
             ariaLabel="Remix this prompt"
           />
        )}
      </div>

      {/* 🟢 HEADER */}
      <div className="mb-8"> 
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {p.tags?.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400 dark:text-blue-300 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
              #{t}
            </span>
          ))}
          
          <div className="flex items-center gap-4 ml-auto">
            {likesCount > 0 && (
              <motion.span 
                initial={false}
                animate={{ scale: activeAction === 'like' ? [1, 1.2, 1] : 1 }}
                className="flex items-center gap-2 text-xs font-bold text-slate-400"
              >
                <Heart size={14} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                {likesCount}
              </motion.span>
            )}
            {remixCount > 0 && (
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Wand2 size={14} />
                {remixCount}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {p.title || "Untitled Prompt"}
        </h3>
      </div>

      {/* 🟢 CONTENT */}
      <div className="relative rounded-3xl bg-white/5 dark:bg-black/30 backdrop-blur-md border border-white/10 group-hover:border-blue-500/40 transition-all duration-500 overflow-hidden shadow-inner">
        <ExpandableText text={p.content} isWide={false} variant="content" />
      </div>

      {/* 🟢 FOOTER */}
      {p.explanation && (
         <div className="mt-8">
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