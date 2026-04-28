'use client'

import { motion } from 'framer-motion'
import { Zap, Shield, Globe } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface FeatureGridProps {
  t: {
    refinement: { title: string; desc: string };
    vault: { title: string; desc: string };
    community: { title: string; desc: string };
  }
}

export default function FeatureGrid({ t }: FeatureGridProps) {
  const isReducedMotion = useReducedMotion();

  return (
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
            title={t.refinement.title}
            desc={t.refinement.desc}
            delay={0}
            isReducedMotion={isReducedMotion}
          />
          <FeatureCard 
            icon={<Shield className="text-emerald-500" />}
            title={t.vault.title}
            desc={t.vault.desc}
            delay={0.1}
            isReducedMotion={isReducedMotion}
          />
          <FeatureCard 
            icon={<Globe className="text-blue-500" />}
            title={t.community.title}
            desc={t.community.desc}
            delay={0.2}
            isReducedMotion={isReducedMotion}
          />
        </motion.div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
  isReducedMotion: boolean;
}

function FeatureCard({ icon, title, desc, delay, isReducedMotion }: FeatureCardProps) {
  return (
    <motion.div 
      transition={{ delay, duration: 0.5 }}
      whileHover={isReducedMotion ? {} : { y: -8 }}
      className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative group overflow-hidden"
    >
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
