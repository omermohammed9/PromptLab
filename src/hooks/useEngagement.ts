'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getDeviceId } from '@/lib/analytics/collector'
import { supabaseclient } from '@/lib/supabase/client'

export function useEngagement() {
  const pathname = usePathname()
  const startTime = useRef(Date.now())
  const maxScroll = useRef(0)
  const metricId = useRef<string | null>(null) // To update the same row

  // 1. Initialize Page Metric Row
  useEffect(() => {
    // Reset for new page
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

    // 2. Setup Interval to Update "Time on Page" every 5 seconds (The "Heartbeat")
    const heartbeat = setInterval(async () => {
      if (!metricId.current) return

      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
      
      // Update DB silently
      await supabaseclient
        .from('page_metrics')
        .update({ time_on_page_seconds: timeSpent })
        .eq('id', metricId.current)

    }, 5000) // Update every 5s

    // 3. Track Scroll Depth
    const handleScroll = () => {
      const scrollPx = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      const percent = Math.round((scrollPx / docHeight) * 100)

      if (percent > maxScroll.current) {
        maxScroll.current = percent
        // Only update DB if they scroll significantly further (e.g., +10%)
        // to save database writes
        if (metricId.current && percent % 10 === 0) {
           supabaseclient.from('page_metrics').update({ scroll_depth_percent: percent }).eq('id', metricId.current).then()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)

    // Cleanup
    return () => {
      clearInterval(heartbeat)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [pathname])
}