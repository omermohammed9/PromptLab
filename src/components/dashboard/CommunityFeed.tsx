'use client'

import { useState, useMemo, useEffect } from 'react'
import { Wand2, LayoutGrid, Lock, User, Globe, ArrowDown, Search } from 'lucide-react'
import {  AnimatePresence } from 'framer-motion'
import { CommunityFeedProps, Prompt, UserSession } from '@/types/interface'
import PromptCard from './PromptCard'

// --- 1. TYPES ---
type ViewMode = 'public' | 'personal'



// --- 2. CUSTOM HOOK (Local Filtering Logic) ---
function useFeedFilter(
  prompts: Prompt[], 
  userPrompts: Prompt[], 
  onServerSearch: (q: string, mode: 'keyword' | 'semantic') => void
) {
  const [viewMode, setViewMode] = useState<ViewMode>('public')
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('keyword')


  // Debounced Server Search (Only for Public view)
  useEffect(() => {
    if (viewMode === 'personal') return
    const timeoutId = setTimeout(() => onServerSearch(searchQuery, searchMode), 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchMode, viewMode, onServerSearch])


  // Calculate Available Tags
  const activeTags = useMemo(() => {
    if (viewMode === 'public') {
      return ['All', 'Business', 'Coding', 'Creative', 'Education', 'Marketing', 'Lifestyle']
    }
    const tags = new Set<string>(['All'])
    userPrompts.forEach(p => p.tags?.forEach(t => tags.add(t)))
    return Array.from(tags).sort()
  }, [viewMode, userPrompts])

  // 🛡️ DEDUPLICATION & FILTERING
  const displayList = useMemo(() => {
    // 1. Select the Source List
    const rawList = viewMode === 'public' ? prompts : userPrompts

    // 2. Deduplicate (Fixes the "Duplicate Key" crash)
    const uniqueList = Array.from(new Map(rawList.map(item => [item.id, item])).values())

    // 3. Filter (Client-side filtering for Personal Vault)
    if (viewMode === 'public') return uniqueList

    return uniqueList.filter(p => {
      const matchesTag = selectedTag === 'All' || p.tags?.includes(selectedTag)
      const q = searchQuery.toLowerCase()
      const matchesSearch = (p.title || "").toLowerCase().includes(q) || 
                            p.content.toLowerCase().includes(q) ||
                            p.tags?.some(t => t.toLowerCase().includes(q))
      return matchesTag && matchesSearch
    })
  }, [viewMode, prompts, userPrompts, selectedTag, searchQuery])

  return {
    viewMode, setViewMode,
    selectedTag, setSelectedTag,
    searchQuery, setSearchQuery,
    searchMode, setSearchMode,
    activeTags,
    displayList
  }
}


// --- 3. MAIN COMPONENT ---

export default function CommunityFeed({ 
  prompts, 
  userPrompts, 
  session, 
  actions,
  state 
}: CommunityFeedProps) {
  
  // Use the local filter hook
  const feed = useFeedFilter(prompts, userPrompts, actions.onSearch)

  // Handlers
  const handleTagSelect = (tag: string) => {
    feed.setSelectedTag(tag)
    if (feed.viewMode === 'public') actions.onFilter(tag)
  }

  const handleModeSwitch = (mode: ViewMode) => {
    feed.setViewMode(mode)
    feed.setSelectedTag('All')
    feed.setSearchQuery('')
    if (mode === 'public') actions.onFilter('All')
  }

  // Derived UI States
  const isLocked = feed.viewMode === 'personal' && !session
  const isEmpty = !state.isLoading && feed.displayList.length === 0
  const showLoadMore = feed.viewMode === 'public' && state.hasMore && !state.isLoading

  return (
    <section className="mt-12 space-y-8">
      
      {/* 1. Header Area */}
      <HeaderControls 
        viewMode={feed.viewMode}
        onModeChange={handleModeSwitch}
        searchQuery={feed.searchQuery}
        onSearchChange={feed.setSearchQuery}
        searchMode={feed.searchMode}
        onSearchModeChange={feed.setSearchMode}
        session={session}
        savedCount={userPrompts.length}
      />


      {/* 2. Tag Navigation */}
      {!isLocked && (
        <TagScroller 
          tags={feed.activeTags}
          selectedTag={feed.selectedTag}
          onSelect={handleTagSelect}
        />
      )}

      {/* 3. Feed Grid */}
      <div className="min-h-[300px]">
        {isLocked ? (
          <LockedState />
        ) : state.isLoading && feed.displayList.length === 0 ? (
          <FeedSkeleton />
        ) : (
          <>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              <AnimatePresence mode="popLayout">
                {isEmpty ? (
                  <div className="col-span-full">
                    <EmptyState 
                      viewMode={feed.viewMode} 
                      searchQuery={feed.searchQuery} 
                      hasPersonalPrompts={userPrompts.length > 0} 
                    />
                  </div>
                ) : (
                  feed.displayList.map((p, index) => (
                    <div key={p.id} className="break-inside-avoid-column mb-6">
                      <PromptCard 
                        prompt={p}
                        index={index}
                        isPublicView={feed.viewMode === 'public'}
                        actions={actions}
                      />
                    </div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {showLoadMore && (
              <LoadMoreButton onClick={actions.onLoadMore} />
            )}
          </>
        )}
      </div>
    </section>
  )
}

// --- 4. REUSABLE UI COMPONENTS ---

const TagScroller = ({ tags, selectedTag, onSelect }: { tags: string[], selectedTag: string, onSelect: (t: string) => void }) => (
  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mask-fade-right">
    {tags.map(tag => (
      <button
        key={tag}
        onClick={() => onSelect(tag)}
        className={`
          px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border capitalize
          ${selectedTag === tag 
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' 
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900'}
        `}
      >
        {tag === 'All' && <LayoutGrid size={14} className="inline mr-2 -mt-0.5" />}
        {tag !== 'All' && '#'}
        {tag}
      </button>
    ))}
  </div>
)

interface HeaderControlsProps {
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchMode: 'keyword' | 'semantic';
  onSearchModeChange: (mode: 'keyword' | 'semantic') => void;
  session: UserSession | null;
  savedCount: number;
}

const HeaderControls = ({ viewMode, onModeChange, searchQuery, onSearchChange, searchMode, onSearchModeChange, session, savedCount }: HeaderControlsProps) => (


  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit mb-4 border border-slate-200 dark:border-slate-800">
        <TabButton 
          active={viewMode === 'public'} 
          onClick={() => onModeChange('public')} 
          icon={<Globe size={16} />} 
          label="Community" 
        />
        <TabButton 
          active={viewMode === 'personal'} 
          onClick={() => onModeChange('personal')} 
          icon={<User size={16} />} 
          label="My Vault" 
        />
      </div>

      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
        {viewMode === 'public' ? 'Community Feed' : 'My Personal Collection'}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2">
        {viewMode === 'public' 
          ? `Explore prompts crafted by the community.` 
          : session 
            ? `You have saved ${savedCount} prompts.` 
            : 'Login to view your saved prompts.'}
      </p>
    </div>

    <div className="flex flex-col md:flex-row md:items-end gap-4 w-full md:w-auto">
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
        <button 
          onClick={() => onSearchModeChange('keyword')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'keyword' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
        >
          Keyword
        </button>
        <button 
          onClick={() => onSearchModeChange('semantic')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${searchMode === 'semantic' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-400'}`}
        >
          <Wand2 size={12} /> Intent
        </button>
      </div>

      <div className="relative group w-full md:w-64">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchMode === 'semantic' ? 'text-purple-500' : 'text-slate-400'} group-focus-within:text-blue-500`} size={16} />
        <input 
          type="text" 
          placeholder={searchMode === 'semantic' ? "Describe your intent..." : (viewMode === 'public' ? "Search community..." : "Search my vault...")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full bg-white dark:bg-slate-900 border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm ${searchMode === 'semantic' ? 'border-purple-500/30 ring-purple-500/10' : 'border-slate-200 dark:border-slate-800'}`}
        />
      </div>
    </div>
  </div>
)


interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton = ({ active, onClick, icon, label }: TabButtonProps) => (

  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
      active 
        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
    }`}
  >
    {icon} {label}
  </button>
)

const LoadMoreButton = ({ onClick }: { onClick: () => void }) => (
  <div className="mt-12 flex justify-center pb-8">
    <button 
      onClick={onClick}
      className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm hover:border-blue-300 hover:text-blue-500 transition-all active:scale-95"
    >
      Load More Prompts
      <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
    </button>
  </div>
)

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {[...Array(6)].map((_, i) => {
         const isWide = i % 7 === 0 || i % 7 === 4;
         return (
           <div key={i} className={`bg-slate-100 dark:bg-slate-800/50 rounded-3xl animate-pulse h-72 ${isWide ? 'lg:col-span-2' : ''}`} />
         )
      })}
    </div>
  )
}

function LockedState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
       <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
         <Lock size={24} />
       </div>
       <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Your Vault is Locked</h3>
       <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
         Log in to access your private collection.
       </p>
    </div>
  )
}

function EmptyState({ viewMode, searchQuery, hasPersonalPrompts }: { viewMode: string, searchQuery: string, hasPersonalPrompts: boolean }) {
  
  const isNewUser = viewMode === 'personal' && !searchQuery && !hasPersonalPrompts;

  // 1. Case: New User (First time in Vault)
  if (isNewUser) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
        {/* Beautiful Abstract Illustration */}
        <div className="relative w-48 h-48 mb-8 group cursor-default">
           <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
           <div className="relative z-10 w-full h-full">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                 <rect x="60" y="40" width="100" height="120" rx="20" transform="rotate(-12 110 100)" fill="currentColor" className="text-slate-200 dark:text-slate-800" />
                 <rect x="60" y="40" width="100" height="120" rx="20" transform="rotate(-6 110 100)" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
                 <rect 
                   x="60" y="40" width="100" height="120" rx="20" 
                   fill="currentColor" 
                   stroke="currentColor" 
                   strokeWidth="2" 
                   className="text-white dark:text-slate-900 stroke-slate-100 dark:stroke-slate-700" 
                 />
                 <rect x="75" y="65" width="70" height="8" rx="4" fill="currentColor" className="text-slate-100 dark:text-slate-800" />
                 <rect x="75" y="85" width="50" height="8" rx="4" fill="currentColor" className="text-slate-100 dark:text-slate-800" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/40 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <Wand2 className="text-white" size={32} />
                 </div>
              </div>
           </div>
        </div>

        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
          Your Vault Awaits
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">
          This is your personal library for prompt engineering. Refine your first idea and save it here forever.
        </p>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 ring-4 ring-blue-500/10"
        >
          <Wand2 size={20} />
          Create your first Masterpiece
        </button>
      </div>
    )
  }

  // 2. Case: No Search Results (The missing piece!)
  return (
    <div className="col-span-full py-20 text-center text-slate-400">
      <div className="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search size={24} className="opacity-50" />
      </div>
      <p className="font-medium text-slate-600 dark:text-slate-300">No prompts found</p>
      <p className="text-sm mt-1">Try adjusting your search terms or filters.</p>
    </div>
  )
}