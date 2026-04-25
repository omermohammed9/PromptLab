import { Toast } from "react-hot-toast";

// 1. The response format from the AI Action
export interface RefinedPrompt {
  refined_prompt: string
  explanation: string
  tags: string[]
  title?: string;
}

// 2. The database row format (Now matches the "Gold Standard" DB Schema)
export interface Prompt {
  id: string
  created_at: string
  title: string | null   // DB allows null
  content: string
  tags: string[] | null  // DB allows null
  is_public: boolean
  user_id: string
  
  // 🛠️ NEW: Required for Admin & Moderation
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  
  //  NOTE: DB does not have this column, so it is optional
  explanation?: string 
  
  likes_count?: number
  remix_count?: number
  is_liked?: boolean

  // Populated only when the query joins the profiles table
  // (e.g. getPublicPrompts). Optional so other queries that don't join
  // still satisfy this interface without casting.
  profiles?: {
    username: string | null
    avatar_url: string | null
  } | null
}

export interface AIProvider {
  name: string;
  isActive: boolean; // 👈 NEW: Explicitly tells TS we can check this
  generate: (systemPrompt: string, userPrompt: string) => Promise<string | null>;
}

// 3. The Auth Session format
export interface UserSession {
  user: {
    id: string
    email?: string
  }
}

// 4. The Admin User Profile (Matches the 'get_admin_users_list' SQL function)
export interface UserProfile {
  id: string;
  email: string | null;
  role: string | null;
  username: string | null;
  full_name: string | null;
  is_banned: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  status: 'Active' | 'Inactive';
  
  last_ip?: string;
  location_data?: {
    city?: string;
    country?: string;
    countryCode?: string;
    isp?: string; // We need this for the Earthlink badge
  }; 
}

export interface CommunityFeedProps {
  prompts: Prompt[]
  userPrompts: Prompt[]
  session: UserSession | null
  actions: {
    onRemix: (content: string, id: string) => void
    onDelete: (id: string, title: string) => void
    onTogglePublic: (id: string, current: boolean) => void
    onSearch: (query: string) => void
    onFilter: (tag: string) => void
    onLoadMore: () => void
    onLike: (id: string) => Promise<any>
  }
  state: {
    isLoading: boolean
    hasMore: boolean
  }
}

export interface FeedProps {
  prompts: Prompt[]
}

export interface NavbarProps {
  session: UserSession | null
  userPrompts: Prompt[]
  // isAdmin?: boolean // 🟢 Optional: If you want to show the Shield icon later
}

export interface DashboardClientProps {
  initialPublicPrompts: Prompt[]
}

export interface ConfirmToastProps {
  t: Toast;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  isDestructive?: boolean; // If true, button becomes Red
}