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

export const getBrowserFingerprint = () => {
  if (typeof window === 'undefined') return {}

  const nav = navigator as unknown as { 
    userAgent: string; 
    language: string; 
    platform?: string; 
    deviceMemory?: number; 
    connection?: { effectiveType?: string };
    hardwareConcurrency?: number;
  }

  return {
    user_agent: nav.userAgent,
    language: nav.language,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || 'direct',
    platform: nav.platform || 'unknown',
    cores: nav.hardwareConcurrency,
    memory_gb: nav.deviceMemory || 'unknown',
    connection_type: nav.connection?.effectiveType || 'unknown',
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