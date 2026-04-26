import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Tag } from 'lucide-react'

const ExpandableText = ({ text, variant = 'content', isWide = false }: { text: string, variant?: 'content' | 'footer', isWide?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const isFooter = variant === 'footer'

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextState = !isExpanded
    setIsExpanded(nextState)

    // 🟢 Keep your Scroll Logic (It syncs perfectly with Framer Motion's default 0.3s duration)
    if (nextState) {
      setTimeout(() => {
        elementRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }, 300)
    }
  }

  return (
    <motion.div
      layout // ✨ MAGIC: Animates the height change smoothly
      ref={elementRef}
      onClick={handleToggle}
      initial={false}
      className={`group/text relative cursor-pointer ${isFooter ? 'flex items-start gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 opacity-80 hover:opacity-100 transition-opacity' : ''}`}
    >
      {isFooter && <Tag size={12} className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />}

      {/* Text Container */}
      <motion.div 
        layout="position" // Ensures text flows smoothly during resize
        className={`
          text-slate-500 dark:text-slate-400 break-words
          ${isFooter ? 'text-xs' : 'p-4 font-mono text-xs leading-relaxed'}
          ${isExpanded ? '' : isFooter ? 'line-clamp-2' : isWide ? 'line-clamp-6' : 'line-clamp-4'}
        `}
      >
        {text}
      </motion.div>

      {/* Gradient Overlay (Fade out when expanded) */}
      {!isExpanded && !isFooter && (
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 dark:from-slate-900/80 to-transparent rounded-b-xl pointer-events-none" />
      )}

      {/* Hover Hint */}
      {!isExpanded && !isFooter && (
        <div className="absolute bottom-2 right-4 opacity-0 group-hover/text:opacity-100 transition-opacity delay-100">
           <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-white/90 dark:bg-black/90 px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
             Read More
           </span>
        </div>
      )}
    </motion.div>
  )
}

export default ExpandableText