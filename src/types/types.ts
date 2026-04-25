export type PromptItem = {
    id: string
    content: string
    status: 'pending' | 'approved' | 'rejected'
    user_id: string
    created_at: string
  }