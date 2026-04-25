'use client'

import { useEffect } from 'react'
import { globalSignOut } from '@/utils/auth-helpers' 

export function useLogout() {

  // 1. Listen for Logout events from OTHER tabs
  useEffect(() => {
    const channel = new BroadcastChannel('auth_channel')
    
    channel.onmessage = async (event) => {
      if (event.data.type === 'LOGOUT_EVENT') {
        // 🔔 Another tab logged out.
        // We run your robust cleanup here too, to ensure this tab 
        // is just as clean as the one that clicked the button.
        await globalSignOut() 
      }
    }

    return () => channel.close()
  }, [])

  // 2. The function the User actually clicks
  const handleLogout = async () => {
    // A. Notify ALL other tabs BEFORE we kill this page
    const channel = new BroadcastChannel('auth_channel')
    channel.postMessage({ type: 'LOGOUT_EVENT' })
    channel.close()

    // B. Run your robust local cleanup & redirect
    await globalSignOut()
  }

  return { handleLogout }
}