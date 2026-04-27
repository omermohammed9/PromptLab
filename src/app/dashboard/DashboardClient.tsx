'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast' 

// Services & Hooks
import { getUserVault } from '@/services/prompts'
import { PromptInputSchema } from '@/lib/validation'
import { usePromptFeed } from '@/hooks/usePromptFeed' 
import { useAuth } from '@/hooks/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { UsageGauge } from '@/components/dashboard/UsageGauge'


export default function DashboardClient({ initialPublicPrompts }: DashboardClientProps) {
  const router = useRouter()
  
  const queryClient = useQueryClient()
  
  // --- 1. UNIFIED AUTH & DATA HOOK ---
  const { session, userPrompts, loading: authLoading } = useAuth(true)

  // --- 2. LOCAL UI STATE ---
  const [input, setInput] = useState('')
  const [refined, setRefined] = useState<RefinedPrompt | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parentId, setParentId] = useState<string | undefined>(undefined)
  
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
    setParentId(id) // Set as parent for versioning
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Toast is now handled in PromptCard for immediate feedback
    if (id) await trackRemixAction(id)
  }

  const handleRefine = async () => {
    if (isAiLoading || isSaving) return
    try {
      const validInput = PromptInputSchema.parse(input)
      setIsAiLoading(true)
      const data = await refinePrompt(validInput)
      setRefined(data)
    } catch (error: any) {
      toast.error(error.message || "Validation failed")
    } finally {
      setIsAiLoading(false)
    }
  }

  // --- 4. MUTATIONS (Optimistic) ---
  
  const saveMutation = useMutation({
    mutationFn: (data: RefinedPrompt) => savePromptAction(data, parentId),
    onSuccess: () => {
      toast.success(parentId ? "Version Saved!" : "Saved to Vault!", { icon: '💾' })
      queryClient.invalidateQueries({ queryKey: ['vault', session?.user?.id] })
    },
    onError: () => toast.error("Failed to save")
  })

  const deleteMutation = useMutation({
    mutationFn: deletePromptAction,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['vault', session?.user?.id] })
      const previousVault = queryClient.getQueryData(['vault', session?.user?.id])
      queryClient.setQueryData(['vault', session?.user?.id], (old: any) => old?.filter((p: any) => p.id !== id))
      return { previousVault }
    },
    onSuccess: () => toast.success("Deleted"),
    onError: (err, id, context) => {
      queryClient.setQueryData(['vault', session?.user?.id], context?.previousVault)
      toast.error("Failed to delete")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', session?.user?.id] })
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    }
  })

  const togglePublicMutation = useMutation({
    mutationFn: ({ id, state }: { id: string, state: boolean }) => togglePromptPublicAction(id, state),
    onMutate: async ({ id, state }) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['vault', session?.user?.id] })
      await queryClient.cancelQueries({ queryKey: ['prompts'] })

      // 2. Snapshot the previous value
      const previousVault = queryClient.getQueryData(['vault', session?.user?.id])
      const previousPrompts = queryClient.getQueryData(['prompts'])

      // 3. Optimistically update the vault
      queryClient.setQueryData(['vault', session?.user?.id], (old: any) => 
        old?.map((p: any) => p.id === id ? { ...p, is_public: state, status: state ? 'approved' : p.status } : p)
      )

      return { previousVault, previousPrompts }
    },
    onError: (err, variables, context) => {
      // Rollback
      queryClient.setQueryData(['vault', session?.user?.id], context?.previousVault)
      queryClient.setQueryData(['prompts'], context?.previousPrompts)
      toast.error("Failed to update status")
    },
    onSuccess: (result) => {
      toast.success(result.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', session?.user?.id] })
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    }
  })

  const likeMutation = useMutation({
    mutationFn: toggleLikeAction,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['prompts'] })
      const previousPrompts = queryClient.getQueryData(['prompts'])
      // Optimistic update for likes would be more complex due to infinite query structure
      // For now we invalidate to keep it simple but "reactive"
      return { previousPrompts }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    }
  })

  const handleSave = () => {
    if (!session) return router.push('/login')
    if (!refined || isAiLoading || saveMutation.isPending) return 
    saveMutation.mutate(refined)
  }

  const handleDelete = (id: string) => {
    toast((t) => (
      <ConfirmToast 
        t={t} 
        title="Delete Prompt?" 
        message="This cannot be undone." 
        confirmLabel="Delete" 
        isDestructive
        onConfirm={() => deleteMutation.mutate(id)}
      />
    ), { ...toastOptions, id: 'delete-confirm' })
  }

  const handleTogglePublic = (id: string, currentStatus: boolean) => {
    const intendedState = !currentStatus
    if (!currentStatus) {
      toast((t) => (
        <ConfirmToast 
          t={t} 
          title="Make Public?" 
          message="This prompt will be visible to everyone on the Community Feed." 
          confirmLabel="Confirm Public" 
          onConfirm={() => togglePublicMutation.mutate({ id, state: intendedState })}
        />
      ), { ...toastOptions, position: 'bottom-center', id: 'public-confirm' })
      return
    }
    togglePublicMutation.mutate({ id, state: intendedState })
  }

  const handleLike = async (id: string) => {
    if (!session) {
      toast.error("Sign in to like prompts", { icon: '🔒' })
      router.push('/login')
      return false
    }
    return likeMutation.mutateAsync(id)
  }

  // --- 5. RENDER ---
  // Uses the loading state from useAuth hook
  if (authLoading) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 p-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        
        <Navbar session={session ?? null} userPrompts={userPrompts} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Spotlight />
          </div>
          <div className="lg:col-span-1">
            {session?.user?.id && <UsageGauge userId={session.user.id} />}
          </div>
        </div>


        <Workbench 
          input={input} setInput={setInput} refined={refined} 
          loading={isAiLoading} isSaving={saveMutation.isPending}
          onRefine={handleRefine} onSave={handleSave} isLoggedIn={!!session}
          parentId={parentId} setParentId={setParentId}
        />

        <CommunityFeed
          prompts={feed.prompts}
          userPrompts={userPrompts}
          session={session ?? null}
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