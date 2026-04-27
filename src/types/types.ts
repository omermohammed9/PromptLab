export type PromptItem = {
    id: string
    content: string
    status: 'pending' | 'approved' | 'rejected' | 'flagged'
    user_id: string
    created_at: string
    moderator_notes?: string | null
  }