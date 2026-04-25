import { supabaseclient } from '@/lib/supabase/client'

export const globalSignOut = async () => {
  // 1. Tell Supabase to kill the session on the server
  await supabaseclient.auth.signOut();

  // 2. Clear Client-Side Storage (The "Memory")
  if (typeof window !== 'undefined') {
    localStorage.clear(); // Wipes Supabase tokens
    sessionStorage.clear(); // Wipes temporary session data
    
    // 3. Manually nuke cookies to be safe
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }

  // 4. Force a hard refresh to the login page (clears React state memory)
  window.location.href = '/login';
};