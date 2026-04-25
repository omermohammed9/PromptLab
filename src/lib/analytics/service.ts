import { supabaseclient } from '@/lib/supabase/client'
import { getDeviceId, getBrowserFingerprint, getMarketingAttribution } from './collector'

export const trackEvent = async (eventName: string, metadata: any = {}) => {
    try {
      const sessionId = getDeviceId()
      const fingerprint = getBrowserFingerprint()
      const attribution = getMarketingAttribution() // 👈 Get UTMs
      const { data: { session } } = await supabaseclient.auth.getSession()
  
      supabaseclient
        .from('analytics_events')
        .insert({
          session_id: sessionId,
          user_id: session?.user?.id || null,
          event_name: eventName,
          url_path: window.location.pathname,
          
          // 🟢 ADDED MARKETING COLUMNS DIRECTLY
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.utm_campaign,
          referrer: attribution.referrer,
  
          meta: {
            ...fingerprint,
            ...metadata
          }
        })
        .then(({ error }) => { 
          if (error) {
            console.error("Analytics Error [Details]:", JSON.stringify(error, null, 2))
          } 
        })
  
    } catch (e) { 
        console.error("Analytics Try/Catch Error:", e) 
    }
  }