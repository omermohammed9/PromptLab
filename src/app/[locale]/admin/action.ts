"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Prompt, UserProfile } from "@/types/interface";

import { requireAdmin } from "@/lib/security";
import { getAIMetrics } from "@/lib/ai/telemetry";

export async function moderatePromptAction(id: string, decision: 'approved' | 'rejected') {
  const supabase = createClient();
  
  // 1. Secure Gatekeeping (Role + IP)
  await requireAdmin(supabase);

  // 3. Perform Update
  const { error } = await supabase
    .from('prompts')
    .update({ 
      status: decision,
      is_public: decision === 'approved'
    })
    .eq('id', id);

  if (error) {
    throw new Error("Failed to update prompt status");
  }

  // 4. Revalidate
  revalidatePath('/admin');
  revalidatePath('/dashboard');

  return { success: true };
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  const supabase = createClient();
  
  // 1. Secure Gatekeeping (Role + IP)
  await requireAdmin(supabase);

  // 2. Perform Update
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error("Update Role Error:", error);
    throw new Error("Failed to update user role");
  }

  // 3. Revalidate
  revalidatePath('/admin');
  
  return { success: true };
}

export async function getAdminUserDetailAction(userId: string) {
  const supabase = createClient();
  await requireAdmin(supabase);

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // 2. Fetch Prompts
  const { data: prompts } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 3. Fetch Likes
  const { data: likes } = await supabase
    .from('prompt_likes')
    .select('prompts(*)')
    .eq('user_id', userId);

  return {
    profile: profile as UserProfile,
    prompts: (prompts ?? []) as Prompt[],
    likedPrompts: (likes?.map((l: any) => l.prompts).filter(Boolean) ?? []) as Prompt[]
  };
}

export async function updateModeratorNotesAction(userId: string, notes: string) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from('profiles')
    .update({ moderator_notes: notes })
    .eq('id', userId);

  if (error) {
    throw new Error("Failed to update moderator notes");
  }

  revalidatePath(`/admin/user/${userId}`);
  return { success: true };
}

export async function fetchAdminUsersAction(page: number, pageSize: number = 10) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const start = page * pageSize;
  const end = start + pageSize - 1;

  // 1. Fetch Paginated Users
  const { data: users, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false }) // Fixed: profiles table uses updated_at, not created_at
    .range(start, end);

  if (error) {
    console.error("Fetch Users Error:", error.message, error.details, error.hint);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return {
    users: (users ?? []) as UserProfile[],
    totalCount: count || 0
  };
}

export async function bulkApprovePromptsAction() {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from('prompts')
    .update({ 
      status: 'approved',
      is_public: true
    })
    .eq('status', 'pending');

  if (error) {
    throw new Error("Failed to bulk approve prompts");
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');

  return { success: true };
}

export async function getAdminAnalyticsAction() {
  const supabase = createClient();
  await requireAdmin(supabase);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isoThirtyDaysAgo = thirtyDaysAgo.toISOString();

  // 1. Growth Metrics (User Registrations - last 30 days)
  // Using updated_at as created_at is missing from profiles table
  const { data: registrationData } = await supabase
    .from('profiles')
    .select('updated_at')
    .gte('updated_at', isoThirtyDaysAgo);

  const registrationsByDate = (registrationData || []).reduce((acc: any, row: any) => {
    const date = row.updated_at.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // 2. Activity Trends (Prompt Creations - last 30 days)
  const { data: promptData } = await supabase
    .from('prompts')
    .select('created_at')
    .gte('created_at', isoThirtyDaysAgo);

  const promptsByDate = (promptData || []).reduce((acc: any, row: any) => {
    const date = row.created_at.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // 3. Content Trends (Popular Tags)
  // Since tags are an array, we still fetch them but limit to recent prompts to avoid memory issues
  const { data: tagData } = await supabase
    .from('prompts')
    .select('tags')
    .order('created_at', { ascending: false })
    .limit(1000); // Only look at the latest 1000 prompts for tags

  const tagFrequency = (tagData || []).reduce((acc: any, row: any) => {
    (row.tags || []).forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  const sortedTags = Object.entries(tagFrequency)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. AI Metrics from Redis
  const aiMetrics = await getAIMetrics(7);

  return {
    growth: {
      registrations: registrationsByDate,
      prompts: promptsByDate
    },
    trends: {
      popularTags: sortedTags
    },
    ai: aiMetrics
  };
}
