'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Save, Copy, Check, Sparkles, ArrowRight, RotateCcw, RotateCw, 
  Code, Mail, Lightbulb, History, Variable, Eye, EyeOff, 
  FileJson, Database, BookOpen, TestTube, Loader2 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefinedPrompt } from '@/types/interface' 
import PromptReasoning from './PromptReasoning'

// ============================================================================
// 1. CONFIG: Expanded Templates Library
// ============================================================================
const TEMPLATES = [
  { 
    label: "Refactor Code", 
    icon: <Code size={14} />, 
    text: "Refactor the following code to be more readable, efficient, and follow DRY principles.\n\nCode:\n{{code_snippet}}" 
  },
  { 
    label: "Unit Tests", 
    icon: <TestTube size={14} />, 
    text: "Write comprehensive unit tests for this {{language}} function using {{testing_framework}}.\n\nFunction:\n{{code}}" 
  },
  { 
    label: "Cold Email", 
    icon: <Mail size={14} />, 
    text: "Draft a cold email to {{target_name}} from {{company_name}} pitching our new product {{product}}. Focus on solving {{pain_point}}." 
  },
  { 
    label: "Explain Concept", 
    icon: <BookOpen size={14} />, 
    text: "Explain {{complex_topic}} to a {{target_audience}} using a simple analogy involving {{analogy_subject}}." 
  },
  { 
    label: "SQL Generator", 
    icon: <Database size={14} />, 
    text: "Write a SQL query to {{goal}} for a table named {{table_name}} with columns {{columns}}." 
  },
  { 
    label: "Brainstorm", 
    icon: <Lightbulb size={14} />, 
    text: "Generate 10 unique ideas for {{topic}}. Prioritize unconventional approaches." 
  }
]

// ============================================================================
// 2. LOGIC LAYER: Time Travel Hook
// ============================================================================
function useHistory(initialState: string) {
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState<string[]>([initialState])
  const [state, setState] = useState(initialState)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (state !== history[index]) {
        const newHistory = [...history.slice(0, index + 1), state]
        if (newHistory.length > 50) newHistory.shift()
        setHistory(newHistory)
        setIndex(newHistory.length - 1)
      }
    }, 800)
    return () => clearTimeout(timeout)
  }, [state, index, history])

  const undo = () => {
    if (index > 0) {
      setIndex(i => i - 1)
      setState(history[index - 1])
    }
  }

  const redo = () => {
    if (index < history.length - 1) {
      setIndex(i => i + 1)
      setState(history[index + 1])
    }
  }

  return { state, setState, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1, currentIndex: index }
}

// ============================================================================
// 3. UI HELPERS: Typewriter
// ============================================================================
const Typewriter = ({ text, speed = 10 }: { text: string, speed?: number }) => {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    setDisplay('')
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplay(prev => prev + text.charAt(i))
        i++
      } else {
        clearInterval(timer)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])
  
  return <span className="whitespace-pre-wrap">{display}</span>
}

// ============================================================================
// 4. SUB-COMPONENT: Variable Manager (Input Side)
// ============================================================================
const VariableManager = ({ variables, values, onChange, disabled }: { variables: string[], values: Record<string, string>, onChange: (k: string, v: string) => void, disabled?: boolean }) => {
  if (variables.length === 0) return null

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }} 
      animate={{ opacity: 1, height: 'auto' }} 
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4"
    >
      <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <Variable size={12} className="text-blue-500" /> Detected Variables
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {variables.map(v => (
          <div key={v} className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 select-none pointer-events-none transition-colors group-focus-within:text-blue-500">
              {`{{`}
            </span>
            <input 
              type="text"
              placeholder={v}
              value={values[v] || ''}
              disabled={disabled}
              onChange={(e) => onChange(v, e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 select-none pointer-events-none transition-colors group-focus-within:text-blue-500">
              {`}}`}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================================================
// 5. SUB-COMPONENT: Output Card
// ============================================================================
const WorkbenchOutput = ({ refined, loading, isSaving, onSave, isLoggedIn }: { refined: RefinedPrompt | null, loading: boolean, isSaving: boolean, onSave: () => void, isLoggedIn: boolean }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (refined?.refined_prompt) {
      navigator.clipboard.writeText(refined.refined_prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isTemplate = refined?.refined_prompt.includes('{{')

  return (
    <AnimatePresence mode='wait'>
      {/* SKELETON */}
      {loading && (
        <motion.div 
          key="skeleton"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Sparkles size={20} className="text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div className="h-5 w-40 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* RESULT */}
      {!loading && refined && (
        <motion.div 
          key="result"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-[2.5rem] p-[1px] overflow-hidden shadow-2xl"
        >
          <div className="relative bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
            
            {/* Toolbar */}
            <div className="flex justify-between items-center px-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={14} /> AI Optimized Result
                </span>
                
                {isTemplate && (
                   <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-[10px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                     <FileJson size={10} />
                     TEMPLATE
                   </span>
                )}
              </div>
              
              <button 
                onClick={handleCopy}
                aria-label="Copy result"
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-all active:scale-90"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-10">
              <div className="font-mono text-base md:text-lg text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto selection:bg-blue-100 dark:selection:bg-blue-900/50">
                 <Typewriter text={refined.refined_prompt} speed={12} />
              </div>

              <div className="mt-8">
                <PromptReasoning text={refined.explanation} variant="blue" />
              </div>

              <div className="flex flex-wrap gap-2 mt-8">
                {refined.tags?.map((tag, i) => (
                  <motion.span 
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full border border-slate-100 dark:border-slate-800"
                  >
                    #{tag}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={onSave}
                disabled={isSaving}
                aria-label={isLoggedIn ? 'Save to Collection' : 'Login to Save'}
                className={`
                  flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center
                `}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isLoggedIn ? (isSaving ? 'Saving...' : 'Save to Vault') : 'Login to Save'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// 6. MAIN ORCHESTRATOR
// ============================================================================
interface WorkbenchProps {
  input: string
  setInput: (val: string) => void
  refined: RefinedPrompt | null
  loading: boolean
  isSaving: boolean
  onRefine: () => void
  onSave: () => void
  isLoggedIn: boolean
}

export default function Workbench({ 
  input: parentInput, 
  setInput: setParentInput, 
  refined, 
  loading, 
  isSaving,
  onRefine, 
  onSave, 
  isLoggedIn 
}: WorkbenchProps) {
  
  const { state: input, setState: setInput, undo, redo, canUndo, canRedo, currentIndex } = useHistory(parentInput)
  
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const isBusy = loading || isSaving

  // Extract Variables
  const variables = useMemo(() => {
    const regex = /\{\{([^}]+)\}\}/g
    const found = new Set<string>()
    let match
    while ((match = regex.exec(input)) !== null) {
      found.add(match[1].trim())
    }
    return Array.from(found)
  }, [input])

  // Preview Logic
  const previewText = useMemo(() => {
    let text = input
    variables.forEach(v => {
      const val = variableValues[v]
      if (val) {
        text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val)
      }
    })
    return text
  }, [input, variables, variableValues])

  const isSyncingToParent = useRef(false)

  useEffect(() => {
    isSyncingToParent.current = true
    setParentInput(input)
    Promise.resolve().then(() => { isSyncingToParent.current = false })
  }, [input, setParentInput])

  useEffect(() => {
    if (!isSyncingToParent.current && parentInput !== input) {
      setInput(parentInput)
    }
  }, [parentInput, setInput, input]) 

  return (
    <section className="mb-16 scroll-mt-24" id="workbench">
      
      {/* INPUT CARD */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/60 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-500 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50">
              <div className="w-2 h-2 rounded-full bg-red-400/80"/>
              <div className="w-2 h-2 rounded-full bg-yellow-400/80"/>
              <div className="w-2 h-2 rounded-full bg-green-400/80"/>
            </div>
            
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={undo} 
                disabled={!canUndo || isBusy} 
                aria-label="Undo"
                className={`p-2 rounded-xl transition-all ${canUndo && !isBusy ? 'text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 active:scale-90 shadow-sm' : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'}`}
                title="Undo"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={redo} 
                disabled={!canRedo || isBusy} 
                aria-label="Redo"
                className={`p-2 rounded-xl transition-all ${canRedo && !isBusy ? 'text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 active:scale-90 shadow-sm' : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'}`}
                title="Redo"
              >
                <RotateCw size={16} />
              </button>
              {canUndo && <span className="text-[10px] text-slate-400 ml-2 font-black uppercase tracking-tighter hidden sm:flex items-center gap-1.5"><History size={12} className="text-blue-500" /> v{currentIndex + 1}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              {variables.length > 0 && (
                <button 
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  aria-label={isPreviewMode ? 'Exit Preview' : 'Enter Preview'}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${isPreviewMode ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 shadow-inner' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  {isPreviewMode ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span className="hidden sm:inline">{isPreviewMode ? 'Live Preview' : 'Preview'}</span>
                </button>
              )}
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">Workbench</div>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-4 relative min-h-[180px]">
          {isPreviewMode ? (
             <div className="w-full h-44 p-4 text-slate-800 dark:text-slate-200 text-base md:text-xl font-mono overflow-y-auto whitespace-pre-wrap selection:bg-blue-100 dark:selection:bg-blue-900/50">
               {previewText}
             </div>
          ) : (
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               disabled={isBusy}
               placeholder="Describe what you want the AI to do... Use {{variables}} to create templates."
               className="w-full h-44 p-4 bg-transparent text-slate-800 dark:text-slate-200 text-base md:text-xl font-mono placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none resize-none z-10 relative selection:bg-blue-100 dark:selection:bg-blue-900/50 disabled:opacity-50"
               spellCheck={false}
             />
          )}

          {!input && !isBusy && (
            <div className="absolute bottom-6 left-6 right-6 flex gap-2 overflow-x-auto pb-4 scrollbar-hide z-20">
              {TEMPLATES.map((t) => (
                <button 
                  key={t.label} 
                  onClick={() => setInput(t.text)} 
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-700 hover:border-blue-500 shadow-sm hover:shadow-blue-500/20 whitespace-nowrap active:scale-95"
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Variable Manager */}
        <AnimatePresence>
           {!isPreviewMode && (
             <VariableManager 
               variables={variables} 
               values={variableValues} 
               disabled={isBusy}
               onChange={(k, v) => setVariableValues(prev => ({...prev, [k]: v}))} 
             />
           )}
        </AnimatePresence>

        <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {input.length} Characters
          </span>
          <button 
            onClick={onRefine} 
            disabled={!input.trim() || isBusy} 
            aria-label="Refine prompt"
            className={`
              flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 
              ${!input.trim() || isBusy 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl hover:shadow-slate-400/20 dark:hover:shadow-white/10 active:scale-95'
              }
            `}
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={16} /> Refining...</>
            ) : (
              <><Sparkles size={16} className="text-blue-500" /> Refine Prompt</>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(loading || refined) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.5 }} 
            className="flex justify-center my-8"
          >
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-blue-500">
              <ArrowRight size={24} className="transform rotate-90 md:rotate-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WorkbenchOutput 
        refined={refined} 
        loading={loading} 
        isSaving={isSaving}
        onSave={onSave} 
        isLoggedIn={isLoggedIn} 
      />

    </section>
  )
}