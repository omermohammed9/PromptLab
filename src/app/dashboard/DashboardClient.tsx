'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast' 

// Services & Hooks
import { getUserVault } from '@/services/prompts'
import { PromptInputSchema, checkRateLimit } from '@/lib/validation'
import { usePromptFeed } from '@/hooks/usePromptFeed' 
import { useAuth } from '@/hooks/useAuth' // 👈 Using the unified Auth Hook
import { 
  deletePromptAction, 
  refinePrompt, 
  savePromptAction, 
  togglePromptPublicAction, 
  toggleLikeAction,
  trackRemixAction
} from './action'

// Types & UI
import { DashboardClientProps, RefinedPrompt } from '@/types/interface'
import { ConfirmToast } from '@/components/ui/ConfirmToast' 
import Navbar from '@/components/Navbar'
import CommunityFeed from '@/components/dashboard/CommunityFeed'
import Workbench from '@/components/dashboard/Workbench'
import Spotlight from '@/components/dashboard/Spotlight'

export default function DashboardClient({ initialPublicPrompts }: DashboardClientProps) {
  const router = useRouter()
  
  // --- 1. UNIFIED AUTH & DATA HOOK ---
  // This replaces all the old useEffects and manual state loading
  const { session, userPrompts, setUserPrompts, loading: authLoading } = useAuth(true)

  // --- 2. LOCAL UI STATE ---
  const [input, setInput] = useState('')
  const [refined, setRefined] = useState<RefinedPrompt | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 🟢 HOOK: Feed Logic
  const feed = usePromptFeed(initialPublicPrompts)

  // --- 3. UI CONFIG ---
  const toastOptions = {
    duration: Infinity,
    position: 'top-center' as const,
    style: { 
      background: 'transparent', 
      boxShadow: 'none',
      maxWidth: 'none'
    }
  }

  // --- 4. HANDLERS ---

  const handleRemix = async (content: string, id: string) => {
    // Safety Check: Prevent accidental overwrites
    if (input.trim().length > 10 && input !== content) {
       toast((t) => (
         <ConfirmToast 
           t={t} 
           title="Overwrite work?" 
           message="Remixing will replace your current text." 
           confirmLabel="Overwrite" 
           isDestructive
           onConfirm={async () => {
             setInput(content); 
             window.scrollTo({ top: 0, behavior: 'smooth' }); 
             await trackRemixAction(id);
           }}
         />
       ), { ...toastOptions, id: 'remix-confirm' })
       return
    }
    
    setInput(content)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Toast is now handled in PromptCard for immediate feedback
    if (id) await trackRemixAction(id)
  }

  const handleRefine = async () => {
    if (isAiLoading || isSaving) return
    try {
      const validInput = PromptInputSchema.parse(input)
      if (session) checkRateLimit(session.user.id)
      setIsAiLoading(true)
      const data = await refinePrompt(validInput)
      setRefined(data)
    } catch (error: any) {
      toast.error(error.message || "Validation failed")
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSave = async () => {
    if (!session) return router.push('/login')
    if (!refined || isAiLoading || isSaving) return 

    try {
      setIsSaving(true)
      await savePromptAction(refined)
      toast.success("Saved to Vault!", { icon: '💾' })
      
      // Refresh Data (Manual re-fetch to update the UI instantly)
      const newVault = await getUserVault()
      if (newVault) setUserPrompts(newVault)
      
    } catch (error: any) {
      toast.error("Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    const executeDelete = async () => {
      try {
        // 1. Call Server Action
        await deletePromptAction(id)
        
        toast.success("Deleted")
        
        // 2. Update UI (Optimistic)
        setUserPrompts(prev => prev.filter(p => p.id !== id))
        feed.removePrompt(id)
      } catch (error) {
        toast.error("Failed to delete")
      }
    }

    toast((t) => (
      <ConfirmToast 
        t={t} 
        title="Delete Prompt?" 
        message="This cannot be undone." 
        confirmLabel="Delete" 
        isDestructive
        onConfirm={executeDelete}
      />
    ), { ...toastOptions, id: 'delete-confirm' })
  }

  const handleTogglePublic = (id: string, currentStatus: boolean) => {
    const executeUpdate = async () => {
      const intendedState = !currentStatus
      
      // 1. Optimistic Update (Guessing success)
      // We assume it toggles, but we might revert if it goes to queue
      setUserPrompts(prev => prev.map(p => 
        p.id === id ? { ...p, is_public: intendedState } : p
      ))

      try {
        // 2. Call Server Action
        const result = await togglePromptPublicAction(id, intendedState)
        
        // 3. Handle Result
        if (result.status === 'pending') {
          // 🟡 If it went to queue, it is technically NOT public yet
          // So we revert the "Public" badge in the UI
          setUserPrompts(prev => prev.map(p => 
            p.id === id ? { ...p, is_public: false, status: 'pending' } : p
          ))
          toast.success("Submitted for Review", { icon: '🛡️' })
        } else {
          // 🟢 Published or Private
          toast.success(result.message)
          if (result.status === 'private') feed.removePrompt(id)
        }

      } catch (error) {
        // 4. Error Rollback
        setUserPrompts(prev => prev.map(p => 
          p.id === id ? { ...p, is_public: currentStatus } : p
        ))
        toast.error("Failed to update status")
      }
    }

    // Logic: Ask before making Public
    if (!currentStatus) {
        toast((t) => (
            <ConfirmToast 
              t={t} 
              title="Make Public?" 
              message="This prompt will be visible to everyone on the Community Feed." 
              confirmLabel="Confirm Public" 
              onConfirm={executeUpdate}
            />
          ), { ...toastOptions, position: 'bottom-center', id: 'public-confirm' })
          return
    }

    executeUpdate()
  }

  const handleLike = async (id: string) => {
    if (!session) {
      toast.error("Sign in to like prompts", { icon: '🔒' })
      router.push('/login')
      throw new Error("Unauthorized")
    }
    return await toggleLikeAction(id)
  }

  // --- 5. RENDER ---
  // Uses the loading state from useAuth hook
  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        
        <Navbar session={session} userPrompts={userPrompts} />
        <Spotlight />

        <Workbench 
          input={input} setInput={setInput} refined={refined} 
          loading={isAiLoading} isSaving={isSaving}
          onRefine={handleRefine} onSave={handleSave} isLoggedIn={!!session}
        />

        <CommunityFeed
          prompts={feed.prompts}
          userPrompts={userPrompts}
          session={session}
          actions={{
            onRemix: handleRemix,
            onDelete: handleDelete,
            onTogglePublic: handleTogglePublic,
            onSearch: feed.search,   
            onFilter: feed.filter,   
            onLoadMore: feed.loadMore,
            onLike: handleLike
          }}
          state={{
            isLoading: feed.isLoading, 
            hasMore: feed.hasMore      
          }}
        />
      </div>
    </div>
  )
}