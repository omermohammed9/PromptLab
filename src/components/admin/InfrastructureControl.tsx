'use client'

import { useState, useEffect } from 'react'
import { Server, Power, AlertTriangle, Trash2, ShieldAlert, Cpu } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSystemConfigAction, updateSystemConfigAction, pruneRedisAction, SystemConfig } from '@/app/[locale]/admin/system-action'
import { useTranslations } from 'next-intl'

export default function InfrastructureControl() {
  const t = useTranslations('infrastructure')
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pruning, setPruning] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const data = await getSystemConfigAction()
      setConfig(data)
    } catch (error: any) {
      toast.error(error.message || t('load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (newConfig: SystemConfig) => {
    setSaving(true)
    try {
      await updateSystemConfigAction(newConfig)
      setConfig(newConfig)
      toast.success(t('config_updated'))
    } catch (error: any) {
      toast.error(error.message || t('update_failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleMaintenance = () => {
    if (!config) return
    const newConfig = { ...config, maintenanceMode: !config.maintenanceMode }
    handleSave(newConfig)
  }

  const handleToggleModel = (model: keyof SystemConfig['modelToggles']) => {
    if (!config) return
    const newConfig = {
      ...config,
      modelToggles: {
        ...config.modelToggles,
        [model]: !config.modelToggles[model]
      }
    }
    handleSave(newConfig)
  }

  const handleUpdateBanner = (bannerText: string) => {
    if (!config) return
    const newConfig = { ...config, globalBanner: bannerText }
    handleSave(newConfig)
  }

  const handlePruneRedis = async () => {
    if (confirm(t('prune_confirm'))) {
      setPruning(true)
      try {
        const result = await pruneRedisAction()
        toast.success(t('cache_pruned', { count: result.count }))
      } catch (error: any) {
        toast.error(error.message || t('update_failed'))
      } finally {
        setPruning(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12 text-slate-500">
        <Server className="animate-pulse" size={32} />
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Maintenance Mode Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${config.maintenanceMode ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t('maintenance_mode')}</h3>
                <p className="text-sm text-slate-400 mt-1">{t('readonly_desc')}</p>
              </div>
            </div>
            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${config.maintenanceMode ? 'bg-red-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {config.maintenanceMode && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{t('readonly_warning')}</span>
            </div>
          )}
        </div>

        {/* Cache Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('cache_control')}</h3>
              <p className="text-sm text-slate-400 mt-1">{t('prune_redis_desc')}</p>
            </div>
          </div>
          <button
            onClick={handlePruneRedis}
            disabled={pruning}
            className="mt-6 w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pruning ? <Server className="animate-spin" size={16} /> : <Trash2 size={16} />}
            {t('prune_redis_btn')}
          </button>
        </div>

        {/* Global Broadcast Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Power size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('global_broadcast')}</h3>
              <p className="text-sm text-slate-400 mt-1">{t('broadcast_desc')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t('broadcast_placeholder')}
              value={config.globalBanner}
              onChange={(e) => setConfig({ ...config, globalBanner: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-600"
            />
            <button
              onClick={() => handleUpdateBanner(config.globalBanner)}
              disabled={saving}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {t('update')}
            </button>
            <button
              onClick={() => {
                setConfig({ ...config, globalBanner: "" })
                handleUpdateBanner("")
              }}
              disabled={saving || !config.globalBanner}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {t('clear')}
            </button>
          </div>
        </div>

        {/* Model Toggles (Kill-Switch) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-2">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Cpu size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('ai_kill_switch')}</h3>
              <p className="text-sm text-slate-400 mt-1">{t('kill_switch_desc')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.keys(config.modelToggles).map((model) => (
              <div key={model} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="capitalize font-bold text-white">{model}</span>
                <button
                  onClick={() => handleToggleModel(model)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${config.modelToggles[model] ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.modelToggles[model] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
