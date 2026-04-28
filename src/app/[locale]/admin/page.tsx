'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { supabaseclient } from '../../../lib/supabase/client'
import { Shield, Ban, CheckCircle, Search, ArrowLeft, LogOut, Copy, UserCog, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { globalSignOut } from '../../../utils/auth-helpers'
import { MessageSquare, Flag, Users, BrainCircuit, Server, Activity } from 'lucide-react'

// Lazy Load Heavy Dashboards
const ModerationQueue = dynamic(() => import('../../../components/admin/ModerationQueue'), {
    loading: () => <div className="h-40 animate-pulse bg-slate-900 rounded-xl" />
})
const ReportsQueue = dynamic(() => import('../../../components/admin/ReportsQueue'), {
    loading: () => <div className="h-40 animate-pulse bg-slate-900 rounded-xl" />
})
const IntelligenceDashboard = dynamic(() => import('../../../components/admin/IntelligenceDashboard'), {
    loading: () => <div className="h-40 animate-pulse bg-slate-900 rounded-xl" />
})
const AnalyticsDashboard = dynamic(() => import('../../../components/admin/AnalyticsDashboard'), {
    loading: () => <div className="h-40 animate-pulse bg-slate-900 rounded-xl" />
})
const InfrastructureControl = dynamic(() => import('../../../components/admin/InfrastructureControl'), {
    loading: () => <div className="h-40 animate-pulse bg-slate-900 rounded-xl" />
})

// Types
import { UserProfile } from '../../../types/interface' 
import { updateUserRoleAction, fetchAdminUsersAction } from './action'

import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'

export default function AdminDashboard() {
    const t = useTranslations('admin')
    const router = useRouter()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all')
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
    const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'reports' | 'intelligence' | 'infrastructure' | 'analytics'>('moderation')
    
    // Pagination State
    const [page, setPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const pageSize = 10

    // Role check is now handled by the server-side layout.tsx
    // We just need to fetch users if we are in the 'users' tab or on mount
    useEffect(() => {
        fetchUsers()
        // Log access (Fire and forget)
        fetch('/api/auth/log-access', { method: 'POST' }).catch(() => {})
    }, [page])

    useEffect(() => {
        fetchUsers()
    }, [page])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { users, totalCount } = await fetchAdminUsersAction(page, pageSize)
            setUsers(users)
            setTotalCount(totalCount)
        } catch (error) {
            console.error("Fetch error:", error)
            toast.error("Could not load user list")
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            toast.loading(t('signing_out'), { id: 'logout' })
            await globalSignOut()
            toast.dismiss('logout')
        } catch (error) {
            // Fallback if globalSignOut fails
            window.location.href = '/login'
        }
    }

    const toggleBan = async (userId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus
        
        // Optimistic Update (Instant UI feedback)
        setUsers(currentUsers =>
            currentUsers.map(u => u.id === userId ? { ...u, is_banned: newStatus } : u)
        )

        const { error } = await supabaseclient
            .from('profiles')
            .update({ is_banned: newStatus })
            .eq('id', userId)

        if (error) {
            toast.error(t('update_failed', { error: error.message }))
            fetchUsers() // Revert data on error
        } else {
            toast.success(newStatus ? t('user_banned') : t('user_unbanned'))
        }
    }

    const handleUpdateRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        
        // Optimistic Update
        setUsers(currentUsers =>
            currentUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
        )

        try {
            await updateUserRoleAction(userId, newRole)
            toast.success(t('user_updated', { role: newRole.toUpperCase() }))
        } catch (error: any) {
            toast.error(t('update_failed', { error: error.message }))
            fetchUsers() // Revert
        }
    }

    // --- Search & Filter Logic ---
    const filteredUsers = users.filter(u => {
        const searchTerm = search.toLowerCase()
        
        // 1. Search Match
        const emailMatch = u.email?.toLowerCase().includes(searchTerm) ?? false
        const nameMatch = u.username?.toLowerCase().includes(searchTerm) ?? false
        const idMatch = u.id?.toLowerCase().includes(searchTerm) ?? false
        const searchMatch = !searchTerm || emailMatch || nameMatch || idMatch

        // 2. Status Match
        const statusMatch = statusFilter === 'all' 
            || (statusFilter === 'banned' && u.is_banned)
            || (statusFilter === 'active' && !u.is_banned)

        // 3. Role Match
        const roleMatch = roleFilter === 'all'
            || (roleFilter === 'admin' && u.role === 'admin')
            || (roleFilter === 'user' && (u.role === 'user' || !u.role))

        return searchMatch && statusMatch && roleMatch
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
                <Shield size={48} className="text-blue-600 animate-pulse" />
                <p className="animate-pulse font-mono">{t('verifying_admin')}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-white">
                            <Shield className="text-blue-500 fill-blue-500/20" size={32} />
                            {t('title')}
                        </h1>
                        <p className="text-slate-400 mt-2">
                            {t('subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg border border-slate-800"
                        >
                            <ArrowLeft size={16} /> {t('dashboard')}
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-950/20 hover:bg-red-900/30 px-4 py-2 rounded-lg border border-red-900/50"
                        >
                            <LogOut size={16} /> {t('logout')}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-800 pb-px overflow-x-auto scrollbar-hide">
                    <button 
                        onClick={() => setActiveTab('moderation')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'moderation' ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <MessageSquare size={16} /> {t('moderation_queue')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'reports' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Flag size={16} /> {t('flagged_reports')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-purple-500 text-purple-500 bg-purple-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Users size={16} /> {t('user_management')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('intelligence')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'intelligence' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <BrainCircuit size={16} /> {t('intelligence')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('infrastructure')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'infrastructure' ? 'border-rose-500 text-rose-500 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Server size={16} /> {t('system_control')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'analytics' ? 'border-teal-500 text-teal-500 bg-teal-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Activity size={16} /> {t('ai_analytics')}
                    </button>
                </div>

                {activeTab === 'moderation' && (
                    <div className="space-y-4">
                        <ModerationQueue />
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-4">
                        <ReportsQueue />
                    </div>
                )}

                {activeTab === 'users' && (
                <>
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 ps-10 pe-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 text-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        >
                            <option value="all">{t('status_all')}</option>
                            <option value="active">{t('status_active')}</option>
                            <option value="banned">{t('status_banned')}</option>
                        </select>

                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        >
                            <option value="all">{t('role_all')}</option>
                            <option value="admin">{t('role_admins')}</option>
                            <option value="user">{t('role_users')}</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl shadow-black/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-5">{t('user_identity')}</th>
                                    <th className="p-5">{t('role')}</th>
                                    <th className="p-5">{t('location_activity')}</th>
                                    <th className="p-5">{t('account_status')}</th>
                                    <th className="p-5 text-end">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-slate-800/30 transition-colors">
                                            
                                            {/* Column 1: Identity */}
                                            <td className="p-5">
                                                <div className="font-medium text-white">
                                                    {user.username || user.full_name || 'No Name'}
                                                </div>
                                                <div className="text-sm text-blue-400">
                                                    {user.email || "No Email"}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {user.id.slice(0, 8)}...
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(user.id);
                                                            toast.success(t('id_copied'));
                                                        }}
                                                        className="text-slate-600 hover:text-blue-400 transition"
                                                        title="Copy ID"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Column 2: Role */}
                                            <td className="p-5">
                                                <button 
                                                    onClick={() => handleUpdateRole(user.id, user.role || 'user')}
                                                    className={`group/role flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
                                                        user.role === 'admin'
                                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                                    }`}
                                                    title={`Click to ${user.role === 'admin' ? 'demote to user' : 'promote to admin'}`}
                                                >
                                                    {user.role || 'user'}
                                                    <UserCog size={12} className="opacity-0 group-hover/role:opacity-100 transition-opacity" />
                                                </button>
                                            </td>

                                            {/* Column 3: Location & Activity */}
                                            <td className="p-5">
                                                <div className="text-sm text-slate-300 mb-1.5 font-medium">
                                                    {(user.last_login || user.last_sign_in_at) 
                                                        ? new Date(user.last_login || user.last_sign_in_at!).toLocaleDateString()
                                                        : <span className="text-slate-600 italic text-xs">Never</span>
                                                    }
                                                </div>
                                                {user.last_ip && (
                                                    <div className="text-[10px] text-slate-600 font-mono">
                                                        IP: {user.last_ip}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Column 4: Status */}
                                            <td className="p-5">
                                                {user.is_banned ? (
                                                    <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded w-fit border border-red-400/20">
                                                        <Ban size={12} /> {t('banned')}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded w-fit border border-emerald-400/20">
                                                        <CheckCircle size={12} /> {t('active')}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Column 5: Actions */}
                                            <td className="p-5 text-end">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/user/${user.id}`}
                                                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700"
                                                        title="View Full History & Notes"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                    
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => toggleBan(user.id, !!user.is_banned)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                user.is_banned
                                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                                : 'bg-red-950 text-red-400 border border-red-900/50 hover:bg-red-900 hover:text-white'
                                                            }`}
                                                        >
                                                            {user.is_banned ? t('unban') : t('ban')}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-slate-500">
                                            {t('no_users_found', { search })}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <div>
                            {t('showing_users', { 
                                start: page * pageSize + 1, 
                                end: Math.min((page + 1) * pageSize, totalCount), 
                                total: totalCount 
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white transition-colors"
                            >
                                {t('previous')}
                            </button>
                            <span className="text-slate-400 font-mono px-2">{t('page')} {page + 1}</span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * pageSize >= totalCount}
                                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:text-white transition-colors"
                            >
                                {t('next')}
                            </button>
                        </div>
                    </div>
                </div>
                </>
                )}

                {activeTab === 'intelligence' && (
                    <div className="space-y-4">
                        <IntelligenceDashboard />
                    </div>
                )}

                {activeTab === 'infrastructure' && (
                    <div className="space-y-4">
                        <InfrastructureControl />
                    </div>
                )}
                
                {activeTab === 'analytics' && (
                    <div className="space-y-4">
                        <AnalyticsDashboard />
                    </div>
                )}
            </div>
        </div>
    )
}