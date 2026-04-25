import { v4 as uuidv4 } from 'uuid'
import Cookies from 'js-cookie' // You might need: npm install js-cookie @types/js-cookie

const COOKIE_NAME = 'pl_device_id'

// 1. Get or Create the Persistent ID
export const getDeviceId = (): string => {
  let id = Cookies.get(COOKIE_NAME)
  if (!id) {
    id = uuidv4()
    // Set cookie for 365 days, accessible across the whole site
    Cookies.set(COOKIE_NAME, id, { expires: 365, secure: true, sameSite: 'strict' })
  }
  return id
}

// 2. Gather "Invisible" Data for ML Training
export const getBrowserFingerprint = () => {
  if (typeof window === 'undefined') return {}

  return {
    user_agent: navigator.userAgent,
    language: navigator.language,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || 'direct',
    platform: (navigator as any).platform || 'unknown',
    cores: navigator.hardwareConcurrency,
    memory_gb: (navigator as any).deviceMemory || 'unknown',
    connection_type: (navigator as any).connection?.effectiveType || 'unknown',
  }
}

export const getMarketingAttribution = () => {
    if (typeof window === 'undefined') return {}
    
    const params = new URLSearchParams(window.location.search)
    
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      referrer: document.referrer || 'direct'
    }
  }