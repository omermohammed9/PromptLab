'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ConfirmedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // 1. Initialize channel
    const channel = new BroadcastChannel('auth_channel');
    
    // 2. Immediate Signal
    // We send this as soon as the component mounts
    channel.postMessage({ type: 'LOGIN_SUCCESS' });

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timer = setTimeout(() => {
      // Attempt close
      window.close();
      
      // If the tab is still open (blocked by browser), redirect here too
      // so BOTH tabs end up at the dashboard as a final fallback
      router.replace('/dashboard');
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      // 🟢 Crucial: Close the channel to free up browser resources
      channel.close();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated Green Signal */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-green-500 rounded-full"
          />
          <div className="relative w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40">
            <CheckCircle2 size={48} strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 text-balance">
          Signed In Successfully!
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
          Identity verified. This tab will auto-close in <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}s</span>.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => router.replace('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-500/20"
          >
            Go to Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => window.close()}
            className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-medium transition-colors"
          >
            Close manually
          </button>
        </div>
      </motion.div>
    </div>
  )
}