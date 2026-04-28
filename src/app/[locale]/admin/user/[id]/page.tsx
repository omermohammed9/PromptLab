'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Clock, ThumbsUp, MessageSquare, Save, User, Mail, Calendar, MapPin, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getAdminUserDetailAction, updateModeratorNotesAction } from '../../action'
import { Prompt, UserProfile } from '@/types/interface'

interface UserDetailPageProps {
    params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
    const { id } = use(params)
    const router = useRouter()
    
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [likes, setLikes] = useState<Prompt[]>([])
    const [loading, setLoading] = useState(true)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'prompts' | 'likes'>('prompts')

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getAdminUserDetailAction(id)
                setProfile(data.profile)
                setPrompts(data.prompts)
                setLikes(data.likedPrompts)
                setNotes(data.profile.moderator_notes || '')
            } catch (error: any) {
                toast.error("Failed to load user details")
                router.push('/admin')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id, router])

    const handleSaveNotes = async () => {
        setSaving(true)
        try {
            await updateModeratorNotesAction(id, notes)
            toast.success("Moderator notes updated")
        } catch (error: any) {
            toast.error("Failed to save notes")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
                <Shield size={48} className="text-blue-600 animate-pulse" />
                <p className="animate-pulse font-mono">Fetching User History...</p>
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="p-2 hover:bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            User Governance: <span className="text-blue-400">{profile.username || profile.full_name || 'Anonymous'}</span>
                        </h1>
                        <p className="text-slate-500 text-sm">Reviewing user timeline and moderation history.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Profile Card & Internal Notes */}
                    <div className="space-y-6">
                        {/* Profile Info */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
                            <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
                                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                                    {profile.username?.[0]?.toUpperCase() || <User />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{profile.username || 'No Username'}</h2>
                                    <p className="text-blue-400 text-sm font-mono">{profile.id.slice(0, 12)}...</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Mail size={16} />
                                    <span>{profile.email || 'Private Email'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Calendar size={16} />
                                    <span>Joined {new Date(profile.updated_at || profile.created_at!).toLocaleDateString()}</span>
                                </div>
                                {profile.location_data?.city && (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <MapPin size={16} />
                                        <span>{profile.location_data.city}, {profile.location_data.country}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Globe size={16} />
                                    <span>Last IP: {profile.last_ip || 'Unknown'}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                                    <div className="text-2xl font-bold text-white">{prompts.length}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Prompts</div>
                                </div>
                                <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                                    <div className="text-2xl font-bold text-white">{likes.length}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Likes</div>
                                </div>
                            </div>
                        </div>

                        {/* Internal Moderator Notes */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 start-0 w-1 h-full bg-amber-500/50" />
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <MessageSquare size={18} className="text-amber-400" />
                                    Moderator Comments
                                </h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Internal Use Only</span>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add private notes about this user's behavior, violations, or special status..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[200px] resize-none"
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Update Notes'}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Timeline / History */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('prompts')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'prompts' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                Prompts Created
                            </button>
                            <button
                                onClick={() => setActiveTab('likes')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'likes' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                Prompts Liked
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="space-y-4">
                            {(activeTab === 'prompts' ? prompts : likes).length > 0 ? (
                                (activeTab === 'prompts' ? prompts : likes).map((item) => (
                                    <div key={item.id} className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-2xl p-5 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${activeTab === 'prompts' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                                                    {activeTab === 'prompts' ? <Clock size={14} /> : <ThumbsUp size={14} />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                item.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {item.status}
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-white mb-2 line-clamp-1">{item.title || 'Untitled Prompt'}</h4>
                                        <p className="text-slate-400 text-sm line-clamp-2 italic">"{item.content}"</p>
                                        
                                        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4 text-slate-500">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <ThumbsUp size={14} /> {item.likes_count || 0}
                                            </div>
                                            {item.tags && item.tags.length > 0 && (
                                                <div className="flex gap-2">
                                                    {item.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl p-20 text-center">
                                    <div className="text-slate-600 mb-2">
                                        {activeTab === 'prompts' ? 'This user hasn\'t created any prompts yet.' : 'This user hasn\'t liked any prompts yet.'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
