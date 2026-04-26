import { getPublicPrompts, searchPublicPrompts } from '@/services/prompts'
import { Prompt } from '@/types/interface'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'

const PAGE_SIZE = 12

export function usePromptFeed(initialPrompts: Prompt[]) {
  const [context, setContext] = useState<{ type: 'all' | 'tag' | 'search', value: string }>({ type: 'all', value: '' })

  // 1. Core Feed Query
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['prompts', context.type, context.value],
    queryFn: async ({ pageParam = 0 }) => {
      if (context.type === 'search') {
        return searchPublicPrompts(context.value)
      }
      return getPublicPrompts({
        page: pageParam,
        tag: context.type === 'tag' ? context.value : undefined,
      })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (context.type === 'search') return undefined // No pagination for search yet
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined
    },
    // initialData: { pages: [initialPrompts], pageParams: [0] } // Disabled to handle context changes better
  })

  // 2. Flatten Pages
  const prompts = useMemo(() => {
    return data?.pages.flat() || []
  }, [data])

  // 3. Actions
  const search = useCallback((query: string) => {
    if (!query.trim()) {
      setContext({ type: 'all', value: '' })
    } else {
      setContext({ type: 'search', value: query })
    }
  }, [])

  const filter = useCallback((tag: string) => {
    if (tag === 'All') {
      setContext({ type: 'all', value: '' })
    } else {
      setContext({ type: 'tag', value: tag })
    }
  }, [])

  return {
    prompts,
    isLoading: isLoading || isFetchingNextPage,
    hasMore: hasNextPage,
    search,
    filter,
    loadMore: fetchNextPage,
    removePrompt: (id: string) => {} // Handle via query client invalidation
  }
}