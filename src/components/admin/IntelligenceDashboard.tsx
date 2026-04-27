'use client'

import { useState, useEffect } from 'react'
import { getAdminAnalyticsAction } from '@/app/[locale]/admin/action'
import { TrendingUp, Activity, Cpu, Coins, Hash, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

interface AnalyticsData {
  growth: {
    registrations: Record<string, number>
    prompts: Record<string, number>
  }
  trends: {
    popularTags: { name: string, count: number }[]
  }
  ai: any[]
}

export default function IntelligenceDashboard() {
  const t = useTranslations('intelligence')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const result = await getAdminAnalyticsAction()
        setData(result as any)
      } catch (error) {
        console.error("Analytics Error:", error)
        toast.error(t('load_failed'))
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [t])

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4">
      <Loader2 className="animate-spin text-purple-500" size={32} />
      <span className="text-sm font-bold uppercase tracking-widest animate-pulse">{t('analyzing_health')}</span>
    </div>
  )

  if (!data) return null

  // 1. Growth Calculation (Simple Daily Avg)
  const totalRegs = Object.values(data.growth.registrations).reduce((a, b) => a + b, 0)
  const totalPrompts = Object.values(data.growth.prompts).reduce((a, b) => a + b, 0)

  // 2. AI Metrics Aggregation
  const totalAIRequests = data.ai.reduce((acc, curr) => acc + parseInt(curr.count || 0), 0)
  const totalErrors = data.ai.reduce((acc, curr) => acc + parseInt(curr.errors || 0), 0)
  const successRate = totalAIRequests > 0 ? ((totalAIRequests - totalErrors) / totalAIRequests * 100).toFixed(1) : "100"
  
  const totalLatency = data.ai.reduce((acc, curr) => acc + parseInt(curr.total_latency || 0), 0)
  const avgLatency = totalAIRequests > 0 ? (totalLatency / (totalAIRequests - totalErrors)).toFixed(0) : "0"

  const totalTokens = data.ai.reduce((acc, curr) => acc + parseInt(curr.total_tokens || 0), 0)
  const estCost = (totalTokens * 0.0000001).toFixed(4) // $0.1 per million tokens (approx)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🚀 Top Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<TrendingUp className="text-emerald-500" />} 
          label={t('total_users')} 
          value={totalRegs.toString()} 
          subtext={t('lifetime_registrations')}
        />
        <StatCard 
          icon={<Activity className="text-blue-500" />} 
          label={t('prompt_activity')} 
          value={totalPrompts.toString()} 
          subtext={t('total_creations')}
        />
        <StatCard 
          icon={<Cpu className="text-purple-500" />} 
          label={t('ai_success')} 
          value={`${successRate}%`} 
          subtext={t('across_requests', { count: totalAIRequests })}
        />
        <StatCard 
          icon={<Coins className="text-amber-500" />} 
          label={t('est_cost')} 
          value={`$${estCost}`} 
          subtext={t('tokens_used', { count: (totalTokens / 1000).toFixed(1) })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 📉 Growth Charts */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <TrendingUp className="text-emerald-500" size={20} />
              {t('growth_trends')}
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('last_30_days')}</span>
          </div>
          
          <div className="h-48 flex items-end gap-1 px-2">
            {Object.entries(data.growth.registrations).slice(-14).map(([date, count], i) => {
               const height = Math.max(10, (count / (Math.max(...Object.values(data.growth.registrations)) || 1)) * 100)
               return (
                 <div key={date} className="flex-1 flex flex-col items-center gap-2 group">
                   <div 
                     className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 border-t-2 border-emerald-500 transition-all duration-500 rounded-t-sm relative"
                     style={{ height: `${height}%` }}
                   >
                     <div className="absolute -top-6 start-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-emerald-600 text-white text-[8px] px-1 rounded transition-opacity font-bold">
                       {count}
                     </div>
                   </div>
                   <span className="text-[8px] text-slate-600 font-mono rotate-45 origin-start">{date.slice(5)}</span>
                 </div>
               )
            })}
          </div>
          <p className="text-xs text-slate-500 italic text-center">{t('registration_frequency')}</p>
        </section>

        {/* 🏷️ Content Trends */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <Hash className="text-blue-500" size={20} />
              {t('popular_categories')}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {data.trends.popularTags.length > 0 ? (
              data.trends.popularTags.map((tag, i) => (
                <div 
                  key={tag.name}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 hover:border-blue-500/50 transition-all hover:scale-105"
                  style={{ opacity: 1 - (i * 0.05) }}
                >
                  <span className="text-xs font-black text-white">{tag.name}</span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 rounded">{tag.count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">{t('no_tags_found')}</p>
            )}
          </div>
          <p className="text-xs text-slate-500 italic">{t('heatmap_tags')}</p>
        </section>

        {/* ⚡ AI Performance Detail */}
        <section className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <Zap className="text-purple-500" size={20} />
              {t('ai_operational_performance')}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                  <th className="pb-4">{t('provider')}</th>
                  <th className="pb-4">{t('avg_latency')}</th>
                  <th className="pb-4">{t('success_rate')}</th>
                  <th className="pb-4">{t('tokens_used_col')}</th>
                  <th className="pb-4 text-end">{t('health')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.ai.length > 0 ? data.ai.map((p, i) => {
                  const pSuccess = ((p.count - (p.errors || 0)) / p.count * 100).toFixed(1)
                  const pAvgLat = (p.total_latency / (p.count - (p.errors || 0))).toFixed(0)
                  return (
                    <tr key={i} className="group hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 text-sm font-bold text-white">{p.provider}</td>
                      <td className="py-4 text-sm text-slate-300 font-mono">{pAvgLat}ms</td>
                      <td className="py-4 text-sm text-slate-300">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${parseFloat(pSuccess) > 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${pSuccess}%` }}
                          />
                        </div>
                        <span className="text-[10px] mt-1 block font-bold">{pSuccess}%</span>
                      </td>
                      <td className="py-4 text-sm text-slate-300 font-mono">{p.total_tokens || 0}</td>
                      <td className="py-4 text-end">
                        {p.errors > 0 ? (
                          <span className="flex items-center justify-end gap-1.5 text-amber-500 text-[10px] font-black uppercase">
                            <AlertCircle size={12} /> {t('degradation')}
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1.5 text-emerald-500 text-[10px] font-black uppercase">
                            <CheckCircle2 size={12} /> {t('optimal')}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-600 text-sm italic">
                      {t('no_telemetry')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subtext }: { icon: any, label: string, value: string, subtext: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-black text-white tracking-tight mb-1">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{subtext}</div>
    </div>
  )
}
