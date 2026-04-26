'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Save, Copy, Check, Sparkles, ArrowRight, RotateCcw, RotateCw,
  Code, Mail, Lightbulb, History, Variable, Eye, EyeOff,
  FileJson, Database, BookOpen, TestTube, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefinedPrompt, Prompt } from '@/types/interface'
import PromptReasoning from './PromptReasoning'
import { getPromptLineage } from '@/services/prompts'
import VisualDiff from './VisualDiff'
import { Columns, Split, FileDown } from 'lucide-react'
import { exportToPDF } from '@/services/pdfExport'
import ParticleBurst from '@/components/ui/ParticleBurst'

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
      setIndex((i: number) => i - 1)
      setState(history[index - 1])
    }
  }

  const redo = () => {
    if (index < history.length - 1) {
      setIndex((i: number) => i + 1)
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
        setDisplay((prev: string) => prev + text.charAt(i))
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
        {variables.map((v: string) => (
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
const WorkbenchOutput = ({
  refined,
  loading,
  isSaving,
  onSave,
  isLoggedIn
}: {
  refined: RefinedPrompt | null,
  loading: boolean,
  isSaving: boolean,
  onSave: () => void,
  isLoggedIn: boolean
}) => {
  const [copied, setCopied] = useState(false)
  const [showPdfOptions, setShowPdfOptions] = useState(false)
  const [burst, setBurst] = useState<{ x: number, y: number } | null>(null)

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
          className="glass p-6 md:p-8 rounded-[2.5rem]"
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
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative glass rounded-[2.5rem] overflow-hidden"
        >
          <div className="relative overflow-hidden">

            {/* Toolbar */}
            <div className="flex justify-between items-center px-6 py-5 bg-white/10 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={14} /> AI Optimized Result
                </span>

                {isTemplate && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    <FileJson size={10} />
                    TEMPLATE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowPdfOptions(!showPdfOptions)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 transition-all active:scale-90"
                    title="Export to PDF"
                  >
                    <FileDown size={18} />
                  </button>
                  
                  <AnimatePresence>
                    {showPdfOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute right-0 top-full mt-2 w-48 glass rounded-2xl p-2 z-50 shadow-2xl"
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-3">Choose Template</p>
                        {(['minimalist', 'modern-dark', 'classic-script'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              exportToPDF(refined, t);
                              setShowPdfOptions(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors capitalize"
                          >
                            {t.replace('-', ' ')}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleCopy}
                  aria-label="Copy result"
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 transition-all active:scale-90"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-10">
              <div className="font-mono text-base md:text-lg text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto selection:bg-blue-500/20">
                <Typewriter text={refined.refined_prompt} speed={12} />
              </div>

              <div className="mt-8">
                <PromptReasoning text={refined.explanation} variant="blue" />
              </div>

              <div className="flex flex-wrap gap-2 mt-8">
                {refined.tags?.map((tag: string, i: number) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white/5 text-slate-400 dark:text-slate-500 rounded-full border border-white/10"
                  >
                    #{tag}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex justify-end">
              {burst && <ParticleBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />}
              <button
                onClick={(e) => {
                  setBurst({ x: e.clientX, y: e.clientY });
                  onSave();
                }}
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
  parentId?: string
  setParentId?: (id: string | undefined) => void
}

export default function Workbench({
  input: parentInput,
  setInput: setParentInput,
  refined,
  loading,
  isSaving,
  onRefine,
  onSave,
  isLoggedIn,
  parentId,
  setParentId
}: WorkbenchProps) {

  const { state: input, setState: setInput, undo, redo, canUndo, canRedo, currentIndex } = useHistory(parentInput)

  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [lineage, setLineage] = useState<Prompt[]>([])
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | null>(null)
  const [compareVersionIndex, setCompareVersionIndex] = useState<number | null>(null)

  // Fetch Lineage when parentId changes
  useEffect(() => {
    if (parentId) {
      getPromptLineage(parentId).then(data => {
        setLineage(data)
        if (data.length > 0) {
          setSelectedVersionIndex(data.length - 1)
        }
      }).catch(console.error)
    } else {
      setLineage([])
      setSelectedVersionIndex(null)
    }
  }, [parentId])

  // Handle Version Selection
  const handleVersionChange = (idx: number) => {
    const version = lineage[idx]
    if (version) {
      setSelectedVersionIndex(idx)
      // Note: We don't necessarily want to overwrite the current workbench state 
      // instantly if the user is typing, but for "Time-Machine" it makes sense.
      setInput(version.content)
    }
  }

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
    variables.forEach((v: string) => {
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
      <div className="relative glass rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-500 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-5 bg-white/10 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50">
              <div className="w-2 h-2 rounded-full bg-red-400/80" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
              <div className="w-2 h-2 rounded-full bg-green-400/80" />
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
            {lineage.length > 1 && selectedVersionIndex !== null && (
              <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-full">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest whitespace-nowrap">
                  Time-Machine
                </span>
                <input
                  type="range"
                  min="0"
                  max={lineage.length - 1}
                  value={selectedVersionIndex}
                  onChange={(e) => handleVersionChange(parseInt(e.target.value))}
                  className="w-24 h-1.5 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                  v{selectedVersionIndex + 1}
                </span>
              </div>
            )}

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
            {parentId && (
              <button
                onClick={() => setParentId?.(undefined)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 rounded-lg transition-colors"
                title="Clear Parent (Start New Lineage)"
              >
                <RotateCcw size={14} />
              </button>
            )}
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
              onChange={(k, v) => setVariableValues((prev: Record<string, string>) => ({ ...prev, [k]: v }))}
            />
          )}
        </AnimatePresence>

        <div className="px-8 py-5 bg-white/5 flex justify-between items-center border-t border-white/10">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {input.length} Characters
            </span>
            {lineage.length > 1 && (
              <button
                onClick={() => {
                  setIsCompareMode(true)
                  if (compareVersionIndex === null) setCompareVersionIndex(lineage.length - 1)
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
              >
                <Split size={12} /> A/B Compare
              </button>
            )}
          </div>
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

      {/* COMPARISON VIEW (Split Screen) */}
      <AnimatePresence>
        {isCompareMode && lineage.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl p-4 md:p-10 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                    <Split size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">A/B Playground</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Visual Diffing Engine</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCompareMode(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-all"
                >
                  Exit Playground
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                {/* Side A: Selected Version */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-900/30 px-3 py-1 rounded-full border border-blue-800">
                      Version A (Base)
                    </span>
                    <select
                      value={selectedVersionIndex ?? 0}
                      onChange={(e) => handleVersionChange(parseInt(e.target.value))}
                      className="bg-slate-800 border-none text-white text-xs font-bold rounded-lg px-3 py-1 outline-none"
                    >
                      {lineage.map((v: Prompt, i: number) => (
                        <option key={v.id} value={i}>Version {i + 1} ({new Date(v.created_at).toLocaleDateString()})</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-6 rounded-[2.5rem] bg-slate-900 border border-slate-800 h-[400px] overflow-y-auto font-mono text-slate-300 text-sm leading-relaxed">
                    {lineage[selectedVersionIndex ?? 0]?.content}
                  </div>
                </div>

                {/* Side B: Comparison Version */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-900/30 px-3 py-1 rounded-full border border-purple-800">
                      Version B (Target)
                    </span>
                    <select
                      value={compareVersionIndex ?? lineage.length - 1}
                      onChange={(e) => setCompareVersionIndex(parseInt(e.target.value))}
                      className="bg-slate-800 border-none text-white text-xs font-bold rounded-lg px-3 py-1 outline-none"
                    >
                      {lineage.map((v: Prompt, i: number) => (
                        <option key={v.id} value={i}>Version {i + 1} ({new Date(v.created_at).toLocaleDateString()})</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-6 rounded-[2.5rem] bg-slate-900 border border-slate-800 h-[400px] overflow-y-auto">
                    {selectedVersionIndex !== null && compareVersionIndex !== null && (
                      <VisualDiff
                        oldText={lineage[selectedVersionIndex].content}
                        newText={lineage[compareVersionIndex].content}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  )
}