'use client'

import React, { useEffect, useState } from 'react';
import { supabaseclient } from '@/lib/supabase/client';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl'

export default function AnalyticsDashboard() {
  const t = useTranslations('analytics')
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabaseclient
          .from('ai_usage_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          setLogs(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">{t('loading_analytics')}</div>;
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Activity className="text-blue-500" />
        {t('ai_request_stream')}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-xs">
              <th className="py-3 px-4">{t('time')}</th>
              <th className="py-3 px-4">{t('model')}</th>
              <th className="py-3 px-4">{t('endpoint')}</th>
              <th className="py-3 px-4">{t('status')}</th>
              <th className="py-3 px-4">{t('latency')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {logs.map((log) => (
              <motion.tr 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={log.id} 
                className="hover:bg-slate-800/30"
              >
                <td className="py-3 px-4 text-xs font-mono text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4 font-medium text-slate-300">
                  {log.model_name}
                </td>
                <td className="py-3 px-4">
                  <span className="bg-slate-800 px-2 py-1 rounded text-xs">
                    {log.endpoint}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {log.status === 'success' ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs">
                      <CheckCircle size={14} /> {t('success')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-xs" title={log.error_type || 'Error'}>
                      <AlertTriangle size={14} /> {t('failed')}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-400">
                  {log.latency_ms ? `${log.latency_ms}ms` : '-'}
                </td>
              </motion.tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  {t('no_requests')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
