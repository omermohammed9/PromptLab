'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // 🟢 Use Next.js Router for smoother redirects
import { supabaseclient } from '@/lib/supabase/client'
import { Shield, Ban, CheckCircle, Search, ArrowLeft, LogOut, Copy, MapPin, Globe, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { globalSignOut } from '@/utils/auth-helpers'
import ModerationQueue from '@/components/admin/ModerationQueue'

// Types
import { UserProfile } from '@/types/interface' 

export default function AdminDashboard() {
    const router = useRouter()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // 1. Security & Role Check
    useEffect(() => {
        let mounted = true

        const initAdmin = async () => {
            try {
                const { data: { user } } = await supabaseclient.auth.getUser()
                
                if (!user) {
                    if (mounted) router.replace('/login')
                    return
                }

                const { data: profile } = await supabaseclient
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                // If not admin, kick them out gently using Router (no hard reload)
                if (profile?.role !== 'admin') {
                    toast.error("Unauthorized access")
                    if (mounted) router.replace('/dashboard') 
                } else {
                    // Log access only if confirmed admin
                    // (Fire and forget - does not block UI)
                    fetch('/api/auth/log-access', { method: 'POST' }).catch(() => {})
                    
                    if (mounted) fetchUsers()
                }
            } catch (error) {
                console.error("Admin check failed", error)
                if (mounted) router.replace('/dashboard')
            }
        }

        initAdmin()

        return () => { mounted = false }
    }, [router])

    const fetchUsers = async () => {
        // We don't set loading(true) here to avoid flashing the whole page 
        // if we just want to refresh data in background
        const { data, error } = await supabaseclient.rpc('get_admin_users_list')

        if (error) {
            console.error("Fetch error:", error)
            toast.error("Could not load user list")
        } else if (data) {
            setUsers(data as UserProfile[])
        }
        setLoading(false)
    }

    const handleLogout = async () => {
        try {
            toast.loading("Signing out...", { id: 'logout' })
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
            toast.error(`Update failed: ${error.message}`)
            fetchUsers() // Revert data on error
        } else {
            toast.success(newStatus ? "User BANNED 🚫" : "User Unbanned ✅")
        }
    }

    // --- Search Filter Logic ---
    const filteredUsers = users.filter(u => {
        const searchTerm = search.toLowerCase()
        if (!searchTerm) return true
        
        // Safe checks for null values
        const emailMatch = u.email?.toLowerCase().includes(searchTerm) ?? false
        const nameMatch = u.username?.toLowerCase().includes(searchTerm) ?? false
        const idMatch = u.id?.toLowerCase().includes(searchTerm) ?? false
        
        return emailMatch || nameMatch || idMatch
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
                <Shield size={48} className="text-blue-600 animate-pulse" />
                <p className="animate-pulse font-mono">Verifying Admin Privileges...</p>
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
                            Admin Command Center
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Monitor user activity and enforce security policies.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg border border-slate-800"
                        >
                            <ArrowLeft size={16} /> Dashboard
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-950/20 hover:bg-red-900/30 px-4 py-2 rounded-lg border border-red-900/50"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>

                {/* Moderation Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                            <Shield size={20} />
                        </span>
                        Moderation Queue
                    </h2>
                    <ModerationQueue />
                </div>

                <div className="h-px bg-slate-800 my-8" />

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by email, name, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* Users Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl shadow-black/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-5">User Identity</th>
                                    <th className="p-5">Role</th>
                                    <th className="p-5">Location & Activity</th>
                                    <th className="p-5">Account Status</th>
                                    <th className="p-5 text-right">Actions</th>
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
                                                            toast.success("ID Copied!");
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
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                    user.role === 'admin'
                                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                    {user.role || 'user'}
                                                </span>
                                            </td>

                                            {/* Column 3: Location & Activity */}
                                            <td className="p-5">
                                                <div className="text-sm text-slate-300 mb-1.5 font-medium">
                                                    {user.last_sign_in_at 
                                                        ? new Date(user.last_sign_in_at).toLocaleDateString()
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
                                                        <Ban size={12} /> BANNED
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded w-fit border border-emerald-400/20">
                                                        <CheckCircle size={12} /> Active
                                                    </span>
                                                )}
                                            </td>

                                            {/* Column 5: Actions */}
                                            <td className="p-5 text-right">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => toggleBan(user.id, !!user.is_banned)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            user.is_banned
                                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                            : 'bg-red-950 text-red-400 border border-red-900/50 hover:bg-red-900 hover:text-white'
                                                        }`}
                                                    >
                                                        {user.is_banned ? "Unban User" : "Ban User"}
                                                    </button>
                                                )}
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-slate-500">
                                            No users found matching "{search}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-950/30 border-t border-slate-800 text-xs text-center text-slate-600">
                        End of records. {filteredUsers.length} users total.
                    </div>
                </div>
            </div>
        </div>
    )
}