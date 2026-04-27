'use client'

import { motion, Variants } from 'framer-motion'
import { Sparkles, Shield, Globe, Zap } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher'
import AuthButton from '@/components/home/AuthButton'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// Animation Variants (The "recipes" for movement)
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
}

const staggerContainer: Variants = {
  visible: { transition: { staggerChildren: 0.15 } }
}

export default function LandingPage() {
  const t = useTranslations('landing');
  const common = useTranslations('common');
  const legal = useTranslations('legal');
  const params = useParams();
  const locale = params.locale as string;
  const isReducedMotion = useReducedMotion();

  const animationProps = isReducedMotion 
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } }
    : { initial: "hidden", animate: "visible", variants: staggerContainer };

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
            {common('title')}
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-4">
             <LocaleSwitcher />
             <ThemeToggle />
             {/* Hide 'Sign In' on very small screens to save space */}
             <div className="hidden sm:block">
                <AuthButton label={common('login')} variant="outline" />
             </div>
             <AuthButton label={t('launch')} variant="primary" />
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6">
        {/*  Dynamic Background Glow (The "Blob") */}
        <div className="absolute top-20 start-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            {...animationProps}
            className="space-y-8"
          >
            {/* Version Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              {t('version')}
            </motion.div>

            {/* Main Headline */}
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              {t('headline').split(',')[0]}, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                {t('headline').split(',')[1]}
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t('subheadline')}
            </motion.p>

            {/* Action Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <div className="w-full sm:w-auto">
                <AuthButton label={t('launch')} variant="primary" icon="rocket" />
              </div>
              <div className="w-full sm:w-auto">
                <AuthButton label={t('vault')} variant="secondary" icon="lock" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. FEATURE CARDS (Animated Grid) */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: isReducedMotion ? 0.3 : 0.8 }}
            className="grid md:grid-cols-3 gap-8"
          >
            <FeatureCard 
              icon={<Zap className="text-amber-500" />}
              title={t('features.refinement.title')}
              desc={t('features.refinement.desc')}
              delay={0}
              isReducedMotion={isReducedMotion}
            />
            <FeatureCard 
              icon={<Shield className="text-emerald-500" />}
              title={t('features.vault.title')}
              desc={t('features.vault.desc')}
              delay={0.1}
              isReducedMotion={isReducedMotion}
            />
            <FeatureCard 
              icon={<Globe className="text-blue-500" />}
              title={t('features.community.title')}
              desc={t('features.community.desc')}
              delay={0.2}
              isReducedMotion={isReducedMotion}
            />
          </motion.div>
        </div>
      </section>
      
      {/* 4. FOOTER */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm font-medium order-2 md:order-1">{t('footer')}</p>
          
          <div className="flex items-center gap-8 order-1 md:order-2">
            <Link 
              href={`/${locale}/privacy`}
              className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
            >
              {legal('privacy')}
            </Link>
            <Link 
              href={`/${locale}/terms`}
              className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
            >
              {legal('terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
  isReducedMotion: boolean;
}

// ✨ Helper Component for Cards with Hover Effects
function FeatureCard({ icon, title, desc, delay, isReducedMotion }: FeatureCardProps) {
  return (
    <motion.div 
      transition={{ delay, duration: 0.5 }}
      whileHover={isReducedMotion ? {} : { y: -8 }}
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