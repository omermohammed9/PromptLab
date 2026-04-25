'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseclient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Loader2, Sparkles, CheckCircle2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [linkSent, setLinkSent] = useState(false) // 🟢 NEW: Tracks success state

  useEffect(() => {
    // 1. Immediate Safety Check: If already logged in, skip the form
    const checkInitialSession = async () => {
      const { data: { user } } = await supabaseclient.auth.getUser();
      if (user) router.replace('/dashboard');
    };
    checkInitialSession();
  
    // 2. Broadcast Channel: Listen for Tab B (The Magic Link click)
    const channel = new BroadcastChannel('auth_channel');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'LOGIN_SUCCESS') {
        router.replace('/dashboard');
      }
    };
  
    // 3. Supabase Auth Listener: Backup for mobile/browsers that sleep tabs
    const { data: { subscription } } = supabaseclient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/dashboard');
      }
    });
  
    return () => {
      channel.close();
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 🛡️ 1. Advanced Validation (Product Specialist Touch)
    // Trim whitespace to prevent accidental "invalid email" errors from trailing spaces
    const cleanEmail = email.trim()
    
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        toast.error("Please enter a valid email address.")
        return
    }

    setLoading(true)
    const origin = window.location.origin
    
    try {
      const { error } = await supabaseclient.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          /**
           * We change the destination to directly go to the dashboard.
           * This is the standard magic link behavior where the new tab
           * logs the user in and sends them straight to their app.
           */
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) throw error
      
      // 🟢 2. UI SUCCESS STATE
      // This triggers the view with the "Open Gmail" buttons and "Wrong Email" link
      setLinkSent(true) 
      toast.success('Check your inbox!')
      
    } catch (error: any) {
      console.error("OTP Error:", error)
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const origin = window.location.origin
    try {
      const { error } = await supabaseclient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      
      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center gap-2">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to access your workspace</p>
        </div>
        {linkSent ? (
            // ✅ VIEW 1: ENHANCED SUCCESS STATE
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
                      <CheckCircle2 className="relative w-12 h-12 text-green-500 mx-auto mb-3" />
                    </div>
                    
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">Check your inbox</h3>
                    
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
                        We sent a secure login link to: <br/>
                        <span className="font-mono font-bold text-slate-900 dark:text-white block mt-1 text-base">{email}</span>
                    </p>

                    {/* 🚀 QUICK ACTION: Open Mail App */}
                    <div className="flex flex-col gap-2 max-w-[200px] mx-auto mb-4">
                      <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm">
                        Open Gmail
                      </a>
                      <a href="https://outlook.live.com" target="_blank" rel="noreferrer" className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold py-2 px-4 rounded-lg transition-colors">
                        Open Outlook
                      </a>
                    </div>

                    <button 
                        onClick={() => setLinkSent(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline flex items-center justify-center gap-1 mx-auto mt-4"
                    >
                        <Pencil size={12} /> Typo? Fix email address
                    </button>
                </div>

                {/* ⚠️ SPAM WARNING */}
                <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mx-auto max-w-[90%]">
                    <span className="font-bold">Can't see it?</span> Check your <span className="font-bold text-slate-900 dark:text-white">Spam</span> or <span className="font-bold text-slate-900 dark:text-white">Promotions</span> folder.
                </div>
            </div>
        ) : (
            // 📝 VIEW 2: LOGIN FORM
            <>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@work.com"
                                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Send Magic Link"}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or continue with</span>
                    </div>
                </div>

                {/* Google Button */}
                <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 group"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                </button>
            </>
        )}

        {/* Footer */}
        {!linkSent && (
            <div className="mt-6 text-center text-xs text-slate-400">
                Works for any email (Outlook, Yahoo, etc). <br/> No password required.
            </div>
        )}
      </div>
    </div>
  )
}