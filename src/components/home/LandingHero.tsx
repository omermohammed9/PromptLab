'use client'

import { motion, Variants } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import AuthButton from './AuthButton'

interface LandingHeroProps {
  t: {
    version: string;
    headline: string;
    subheadline: string;
    launch: string;
    vault: string;
  }
}

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

export default function LandingHero({ t }: LandingHeroProps) {
  const isReducedMotion = useReducedMotion();

  const animationProps = isReducedMotion 
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } }
    : { initial: "hidden", animate: "visible", variants: staggerContainer };

  const [headlinePart1, headlinePart2] = t.headline.split(',');

  return (
    <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6">
      <div className="absolute top-20 start-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow pointer-events-none" />
      
      <div className="max-w-5xl mx-auto text-center">
        <motion.div 
          {...animationProps}
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            {t.version}
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            {headlinePart1}, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {headlinePart2}
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t.subheadline}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <div className="w-full sm:w-auto">
              <AuthButton label={t.launch} variant="primary" icon="rocket" />
            </div>
            <div className="w-full sm:w-auto">
              <AuthButton label={t.vault} variant="secondary" icon="lock" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
