'use client'

import { motion, Variants } from 'framer-motion'
import { Sparkles, Shield, Globe, Zap } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import AuthButton from '@/components/home/AuthButton'

// Animation Variants (The "recipes" for movement)
// 2. Add ': Variants' type here 
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
}

// 3. Add ': Variants' type here as well 
const staggerContainer: Variants = {
  visible: { transition: { staggerChildren: 0.15 } }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden selection:bg-blue-500/30">
      
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Sparkles size={20} fill="currentColor" />
            </div>
            PromptLab
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-4">
             <ThemeToggle />
             {/* Hide 'Sign In' on very small screens to save space */}
             <div className="hidden sm:block">
                <AuthButton label="Sign In" variant="outline" />
             </div>
             <AuthButton label="Get Started" variant="primary" />
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6">
        {/*  Dynamic Background Glow (The "Blob") */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Version Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              V2.0 Now Live
            </motion.div>

            {/* Main Headline */}
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Engineer perfect prompts, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                faster than ever.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              The all-in-one workbench for prompt engineering. Refine, test, store, and share your AI prompts with a community of experts.
            </motion.p>

            {/* Action Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <div className="w-full sm:w-auto">
                <AuthButton label="Launch Workbench" variant="primary" icon="rocket" />
              </div>
              <div className="w-full sm:w-auto">
                <AuthButton label="Log In to Vault" variant="secondary" icon="lock" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. FEATURE CARDS (Animated Grid) */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8"
          >
            <FeatureCard 
              icon={<Zap className="text-amber-500" />}
              title="AI Refinement"
              desc="Automatically upgrade basic prompts into professional-grade instructions using our fine-tuned models."
              delay={0}
            />
            <FeatureCard 
              icon={<Shield className="text-emerald-500" />}
              title="Private Vault"
              desc="Securely store your intellectual property. Your secret prompts stay yours forever, encrypted at rest."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Globe className="text-blue-500" />}
              title="Community Feed"
              desc="Discover what others are building. Remix public prompts and learn from the best engineers."
              delay={0.2}
            />
          </motion.div>
        </div>
      </section>
      
      {/* 4. FOOTER */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-500 text-sm font-medium">© 2026 PromptLab. Built for the future of AI.</p>
      </footer>
    </div>
  )
}

// ✨ Helper Component for Cards with Hover Effects
function FeatureCard({ icon, title, desc, delay }: any) {
  return (
    <motion.div 
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative group overflow-hidden"
    >
      {/* Hover Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 text-xl shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {desc}
        </p>
      </div>
    </motion.div>
  )
}