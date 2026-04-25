'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/service'

export function useTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initRef = useRef(false)

  // 1. Track "Session Start" (Once per page load)
  useEffect(() => {
    if (!initRef.current) {
      trackEvent('session_start', {
        entry_point: pathname
      })
      initRef.current = true
    }
  }, [])

  // 2. Track Page Views (Every time URL changes)
  useEffect(() => {
    trackEvent('page_view', {
      path: pathname,
      params: searchParams.toString()
    })
  }, [pathname, searchParams])
}