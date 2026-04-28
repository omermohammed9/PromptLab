'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getDeviceId } from '@/lib/analytics/collector'
import { supabaseclient } from '@/lib/supabase/client'

export function useEngagement() {
  const pathname = usePathname()
  const startTime = useRef(0)
  const maxScroll = useRef(0)
  const metricId = useRef<string | null>(null)

  useEffect(() => {
    startTime.current = Date.now()
    maxScroll.current = 0
    metricId.current = null

    const initMetric = async () => {
      const sessionId = getDeviceId()
      const { data } = await supabaseclient
        .from('page_metrics')
        .insert({
          session_id: sessionId,
          url_path: pathname,
          time_on_page_seconds: 0,
          scroll_depth_percent: 0
        })
        .select()
        .single()
      
      if (data) metricId.current = data.id
    }

    initMetric()

    // 1. Reduced Heartbeat Frequency (30s)
    const heartbeat = setInterval(async () => {
      if (!metricId.current) return
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
      
      await supabaseclient
        .from('page_metrics')
        .update({ time_on_page_seconds: timeSpent })
        .eq('id', metricId.current)

    }, 30000)

    // 2. Debounced Scroll Tracking
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        if (!metricId.current) return
        
        const scrollPx = window.scrollY + window.innerHeight
        const docHeight = document.documentElement.scrollHeight
        const percent = Math.round((scrollPx / docHeight) * 100)

        if (percent > maxScroll.current) {
          maxScroll.current = percent
          // Only update DB if they scroll significantly further (e.g., +10%)
          if (percent % 10 === 0 || percent > 95) {
             supabaseclient
              .from('page_metrics')
              .update({ scroll_depth_percent: percent })
              .eq('id', metricId.current)
              .then()
          }
        }
      }, 500)
    }

    // 3. Final Report on Unload (Beacon-like)
    const handleUnload = () => {
      if (!metricId.current) return
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
      
      // We use the regular client here as it's cleaner, 
      // but in a real high-traffic app we might use fetch(..., { keepalive: true })
      supabaseclient
        .from('page_metrics')
        .update({ 
          time_on_page_seconds: timeSpent,
          scroll_depth_percent: maxScroll.current
        })
        .eq('id', metricId.current)
        .then()
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnload()
    })

    return () => {
      clearInterval(heartbeat)
      window.removeEventListener('scroll', handleScroll)
      handleUnload()
    }
  }, [pathname])
}