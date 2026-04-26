"use server";

import { createClient } from '@/lib/supabase/server';
import { Prompt, RefinedPrompt } from '@/types/interface';
import { ActionSchema } from '@/lib/validation';
import sanitizeHtml from 'sanitize-html';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

// A. Fetch Public Feed (Paginated + Tag-Filtered)
// ─── Security contract ────────────────────────────────────────────────────────
// • .eq('status', 'approved') and .eq('is_public', true) are unconditional —
//   callers have zero ability to bypass or override these filters.
// • tag is normalised to lowercase server-side before hitting the DB.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPublicPrompts({
  page,
  tag,
}: {
  page: number;
  tag?: string;
}): Promise<Prompt[]> {
  console.log('DEBUG: getPublicPrompts called', { page, tag });
  const supabase = await createClient();

  const from = page * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  // Start with the security-critical base query — these two filters are NEVER
  // omitted regardless of what the caller passes.
  let query = supabase
    .from('prompts')
    .select('*, profiles(username, avatar_url)')  // join author profile for feed cards
    .eq('status', 'approved')   // SECURITY: only approved content
    .eq('is_public', true)      // SECURITY: only public content
    .order('created_at', { ascending: false })
    .range(from, to);

  // Apply tag filter when provided — always lowercased to prevent case-bypass.
  if (tag) {
    query = query.contains('tags', [tag.toLowerCase()]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching public feed:', error);
    throw error;
  }

  return (data ?? []) as Prompt[];
}

// B. Fetch User Vault (Your Personal Space)
export async function getUserVault() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', user.id)
    // 👇 ADD THIS LINE to hide system tips from your vault
    .not('tags', 'cs', '{"tip"}') 
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error("Error fetching vault:", error)
    // It's usually better to return empty array [] than throw error in UI fetchers
    // to prevent the whole page from crashing
    return [] 
  }
  
  return data as Prompt[]
}

// C. Smart Save (Single Secure Data Pipeline)
// ─── Security contract ────────────────────────────────────────────────────────
// 1. userId is NEVER accepted from the caller — it is resolved from the
//    server-side session cookie, making it impossible to spoof.
// 2. All user-supplied string fields are run through sanitize-html before
//    they reach the database, preventing stored-XSS.
// ─────────────────────────────────────────────────────────────────────────────
export async function savePromptToVault(prompt: RefinedPrompt, parentId?: string) {
  const supabase = await createClient();

  // 1. Resolve identity from the server-side session — never trust the caller.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized: You must be logged in to save.");

  // 2. Sanitize every user-supplied string field before it touches the DB.
  const cleanContent     = sanitizeHtml(prompt.refined_prompt ?? '');
  const cleanExplanation = sanitizeHtml(prompt.explanation    ?? '');
  const cleanTitle       = prompt.title ? sanitizeHtml(prompt.title) : 'Untitled Prompt';
  const cleanTags        = (prompt.tags ?? []).map(tag => sanitizeHtml(tag));

  // 3. Build the insert payload — user_id comes only from the verified session.
  const payload = {
    user_id:     user.id,
    title:       cleanTitle,
    content:     cleanContent,
    explanation: cleanExplanation,
    tags:        cleanTags,
    is_public:   false,   // Private by default
    status:      'pending' as const, // 🚦 Enters moderation queue
    parent_id:   parentId || null,
    version_number: 1,
  };

  // 4. Handle Versioning Logic
  if (parentId) {
    // Fetch the highest version number in this lineage to increment it
    const { data: latestVersion } = await supabase
      .from('prompts')
      .select('version_number')
      .eq('parent_id', parentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    payload.version_number = (latestVersion?.version_number ?? 1) + 1;
  }

  // 4. Insert
  const { data, error } = await supabase
    .from('prompts')
    .insert(payload)
    .select()
    .single();

  // 5. Handle Duplicate Error (Postgres Error 23505)
  if (error) {
    if (error.code === '23505') {
      throw new Error("You already have this prompt in your vault!");
    }
    console.error("Save error:", error);
    throw error;
  }
  
  return data;
}

// D. Search (Robust Filtering)
export async function searchPublicPrompts(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'approved') // 🛡️ Must be approved to appear in search
    // We use ILIKE because 'websearch' requires specific index setup
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(50)
    
  if (error) throw error
  return data as Prompt[]
}

// E. Remix Tracking — calls the 'increment_remix' DB function atomically
export async function trackRemix(promptId: string) {
  const supabase = await createClient();

  // 1. Secure identity resolution
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized: You must be logged in to remix.');

  // 2. Validate Input
  ActionSchema.parse({ id: promptId });

  const { error } = await supabase.rpc('increment_remix', {
    target_prompt_id: promptId,
  });

  if (error) {
    // Non-fatal: log the failure but do not surface it to the caller so that
    // a broken analytics path never prevents a remix from completing.
    console.error('trackRemix RPC error:', error);
  }
}

// F. Toggle Like — returns the NEW like status (true = liked, false = unliked)
// ─── Security contract ────────────────────────────────────────────────────────
// • Identity is resolved from the server-side session cookie — the caller
//   never supplies a userId, making it impossible to like on behalf of another
//   user.
// • All DB operations are scoped to the authenticated user's id, which is also
//   enforced server-side by the Row Level Security policies on prompt_likes.
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleLike(promptId: string): Promise<boolean> {
  const supabase = await createClient();

  // 1. Resolve identity from the verified session — never trust the caller.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized: You must be logged in to like a prompt.');

  // 2. Validate Input
  ActionSchema.parse({ id: promptId });

  // 2. Check whether this user has already liked the prompt.
  const { data: existingLike, error: selectError } = await supabase
    .from('prompt_likes')
    .select('prompt_id')
    .eq('prompt_id', promptId)
    .eq('user_id', user.id)
    .maybeSingle(); // returns null (not an error) when no row is found

  if (selectError) {
    console.error('toggleLike select error:', selectError);
    throw selectError;
  }

  if (existingLike) {
    // 3a. Row exists → user already liked it → DELETE (unlike)
    const { error: deleteError } = await supabase
      .from('prompt_likes')
      .delete()
      .eq('prompt_id', promptId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('toggleLike delete error:', deleteError);
      throw deleteError;
    }

    return false; // new status: unliked
  } else {
    // 3b. No row → user has not liked it yet → INSERT (like)
    const { error: insertError } = await supabase
      .from('prompt_likes')
      .insert({ prompt_id: promptId, user_id: user.id });

    if (insertError) {
      console.error('toggleLike insert error:', insertError);
      throw insertError;
    }

    return true; // new status: liked
  }
}

// G. Get Prompt Lineage (History)
export async function getPromptLineage(rootId: string): Promise<Prompt[]> {
  const supabase = await createClient();

  // Fetch the root prompt AND all prompts that claim it as parent
  const { data, error } = await supabase
    .from('prompts')
    .select('*, profiles(username, avatar_url)')
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
    .order('version_number', { ascending: true });

  if (error) {
    console.error('Error fetching lineage:', error);
    throw error;
  }

  return (data ?? []) as Prompt[];
}
