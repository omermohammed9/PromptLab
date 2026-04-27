"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldAlert } from 'lucide-react';
import { getUserUsageStats, UsageStats } from '@/services/analytics';

interface UsageGaugeProps {
  userId: string;
}

import { useTranslations } from 'next-intl';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const UsageGauge: React.FC<UsageGaugeProps> = ({ userId }) => {
  const t = useTranslations('usage');
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const isReducedMotion = useReducedMotion();

  const fetchStats = React.useCallback(async () => {
    try {
      const data = await getUserUsageStats(userId);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [userId, fetchStats]);

  if (loading || !stats) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-white/5 rounded-[2rem] animate-pulse border border-white/10">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.percentUsed / 100) * circumference;

  return (
    <motion.div
      initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl glassmorphism flex flex-col items-center justify-center overflow-hidden group"
      role="progressbar"
      aria-valuenow={stats.count}
      aria-valuemin={0}
      aria-valuemax={stats.limit}
      aria-label={t('quota_title')}
    >
      {/* Background Glow */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${
        stats.percentUsed > 80 ? 'bg-red-500' : 'bg-blue-500'
      }`} />

      <div className="relative w-40 h-40">
        {/* SVG Gauge */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-white/5"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className={`${
              stats.percentUsed > 80 ? 'text-red-500' : 'text-blue-500'
            } drop-shadow-[0_0_8px_currentColor]`}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">
            {stats.remaining}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {t('left')}
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-1 flex items-center justify-center gap-2">
          {stats.percentUsed > 80 ? (
            <ShieldAlert className="w-3 h-3 text-red-400" />
          ) : (
            <Zap className="w-3 h-3 text-blue-400" />
          )}
          {t('quota_title')}
        </h4>
        <p className="text-[10px] text-white/30 font-medium">
          {t('used_of_limit', { count: stats.count, limit: stats.limit })}
        </p>
      </div>

      {/* Hover Status */}
      <div className="absolute top-4 end-4">
        <div className={`w-2 h-2 rounded-full animate-ping ${
          stats.percentUsed > 80 ? 'bg-red-500' : 'bg-green-500'
        }`} />
      </div>
    </motion.div>
  );
};
