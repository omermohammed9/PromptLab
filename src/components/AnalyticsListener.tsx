'use client' // 👈 This magic line makes hooks work

import { Suspense } from 'react'
import { useTracker } from '@/hooks/useTracker'
import { useEngagement } from '@/hooks/useEngagement'

function AnalyticsHooks() {
  useTracker()      // Starts tracking Page Views
  useEngagement()   // Starts tracking Time & Scroll
  return null
}

export default function AnalyticsListener() {
  return (
    <Suspense fallback={null}>
      <AnalyticsHooks />
    </Suspense>
  )
}