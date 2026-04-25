import { useState, useCallback } from 'react'
import { getPublicPrompts, searchPublicPrompts } from '@/services/prompts'
import { Prompt } from '@/types/interface'
import toast from 'react-hot-toast'

const PAGE_SIZE = 12

export function usePromptFeed(initialPrompts: Prompt[]) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPrompts.length === PAGE_SIZE)
  const [page, setPage] = useState(0)
  const [context, setContext] = useState<{ type: 'all' | 'tag' | 'search', value: string }>({ type: 'all', value: '' })

  // 1. Core Fetcher — delegates to the secured server action.
  //    Security guarantees (status=approved, is_public=true) are enforced
  //    server-side and cannot be bypassed by the browser.
  const fetchPrompts = useCallback(async (pageIndex: number, filterType: 'all' | 'tag', filterValue = '') => {
    setIsLoading(true)
    try {
      const data = await getPublicPrompts({
        page: pageIndex,
        tag: filterType === 'tag' ? filterValue : undefined,
      })

      setPrompts(prev => pageIndex === 0 ? data : [...prev, ...data])
      // hasMore is true only when a full page was returned — same contract as before.
      setHasMore(data.length === PAGE_SIZE)
    } catch (error) {
      console.error('Feed Error:', error)
      toast.error('Failed to load feed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 2. Public Actions
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setContext({ type: 'all', value: '' })
      setPage(0)
      return fetchPrompts(0, 'all')
    }
    setIsLoading(true)
    setContext({ type: 'search', value: query })
    try {
      const results = await searchPublicPrompts(query)
      if (results) {
        setPrompts(results)
        setHasMore(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [fetchPrompts])

  const filter = useCallback((tag: string) => {
    if (tag === 'All') {
      setContext({ type: 'all', value: '' })
      setPage(0)
      return fetchPrompts(0, 'all')
    }
    setContext({ type: 'tag', value: tag })
    setPage(0)
    fetchPrompts(0, 'tag', tag)
  }, [fetchPrompts])

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    if (context.type === 'search') return // No pagination for search yet
    fetchPrompts(nextPage, context.type as 'all' | 'tag', context.value)
  }, [page, context, fetchPrompts])

  // Helper to manually remove an item (e.g. after delete)
  const removePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id))
  }

  return {
    prompts,
    isLoading,
    hasMore,
    search,
    filter,
    loadMore,
    removePrompt
  }
}