import { getPublicPrompts } from '@/services/prompts'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

// 🟢 This is a Server Component by default (no 'use client' at the top)
export default async function DashboardPage() {
  
  // 1. Fetch data on the Server
  // This happens on the backend, so it's instant and SEO friendly.
  const publicPrompts = await getPublicPrompts({ page: 0 }) || []

  // 2. Pass data to the Client Component
  return (
    <DashboardClient initialPublicPrompts={publicPrompts} />
  )
}