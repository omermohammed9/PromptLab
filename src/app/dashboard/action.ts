'use server'

import { generateContent } from "@/lib/ai/orchestrator";
import { parseAIResponse } from "@/lib/ai/interface";
import { RefinedPrompt } from "@/types/interface";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/validation";
import { savePromptToVault, toggleLike, trackRemix } from "@/services/prompts";

// ... [Keep your cleanJsonOutput function exactly as is] ...
function cleanJsonOutput(input: any): string {
  if (!input) return "{}";
  if (typeof input === 'object') return JSON.stringify(input);
  if (typeof input === 'string') {
    return input.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  return String(input);
}


export async function refinePrompt(originalPrompt: string) {

  // ─── 1. AUTH GATE ────────────────────────────────────────────────────────
  // Must be the very first operation. Derives identity from the server-side
  // cookie — never trust a client-supplied userId.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: You must be signed in to refine a prompt.");
  }

  // ─── 2. RATE LIMIT GATE ──────────────────────────────────────────────────
  // Sliding window check via Vercel KV. Throws if the user has exceeded
  // MAX_REQUESTS within the rolling window. Must run before any AI call.
  await checkRateLimit(user.id);

  // ─── 3. SYSTEM PROMPT (Enforce JSON) ─────────────────────────────────────
  const systemPrompt = `
    You are a World-Class Prompt Engineer. You are NOT a creative writer.
    Your goal is to optimize the user's input using the CO-STAR framework.

    STRICT OUTPUT RULES:
    1. Return ONLY valid, raw JSON. 
    2. Do NOT write a story, code, or article. ONLY output the JSON object.
    
    OUTPUT JSON STRUCTURE:
    {
      "title": "A Short Catchy Name (Max 5 Words)",
      "refined_prompt": "The advanced prompt text...",
      "explanation": "Brief reasoning...",
      "tags": ["Tag1", "Tag2"]
    }
  `;

  // 🟢 4. SANDBOX THE USER INPUT
  // This wrapper prevents the AI from executing the malicious command
  const userMessage = `Refine this prompt for me: "${originalPrompt}"`;

  try {
    // 🟢 Send 'userMessage' instead of 'originalPrompt'
    const rawResult = await generateContent(systemPrompt, userMessage);

    if (!rawResult) throw new Error("No content generated");

    const cleanedResult = cleanJsonOutput(rawResult);
    return JSON.parse(cleanedResult);

  } catch (error) {
    console.error("Refinement Parsing Error:", error);
    return {
      title: "Draft Prompt",
      refined_prompt: originalPrompt,
      explanation: "AI formatting failed. Returning original text.",
      tags: ["Error", "Retry"]
    };
  }
}


export async function generateTip() {
  try {
    const supabase = await createClient()

    // Step 1: Secure Gatekeeping
    await requireAdmin(supabase)

    // Step 2: AI Heavy Lifting
    const aiData = await fetchTipFromAI()

    // Step 3: Database Persistence
    const savedTip = await saveTipToDatabase(supabase, aiData)

    // Step 4: Refresh UI
    revalidatePath('/dashboard')
    
    return savedTip

  } catch (error: any) {
    console.error("Generate Tip Action Failed:", error)
    throw new Error(error.message || "Failed to generate tip")
  }
}

// --- 2. HELPER: Security ---
async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error("Forbidden: Only Admins can perform this action")
  }
}

// --- 3. HELPER: AI Logic & Parsing ---
async function fetchTipFromAI() {
  const SYSTEM_PROMPT = `
    You are a backend API that generates JSON data.
    STRICT RULES: Output ONLY valid JSON. No markdown. No intro text.
    REQUIRED STRUCTURE:
    {
      "content": "The main concise tip (max 20 words)",
      "explanation": "Technical insight explaining 'why' (max 30 words)",
      "tags": ["tag1", "tag2"]
    }
  `
  
  const rawResult = await generateContent(SYSTEM_PROMPT, "Generate a high-value prompt engineering tip for advanced users.")
  if (!rawResult) throw new Error("AI returned empty response")

  // Delegate all cleaning, parsing, and extraction to the canonical helper.
  const parsed = typeof rawResult === 'object' ? rawResult : parseAIResponse(rawResult)

  // Validation
  if (!parsed?.content || !parsed?.explanation) {
    throw new Error("AI JSON missing required fields")
  }

  return parsed
}

// --- 4. HELPER: Database Write ---
async function saveTipToDatabase(supabase: any, data: any) {
  const finalTags = Array.from(new Set([
    ...(data.tags || []), 'tip', 'ai-generated'
  ]))

  const { data: saved, error } = await supabase.from('prompts').insert({
    title: 'Daily AI Tip',
    content: data.content,
    explanation: data.explanation,
    is_public: true,
    status: 'approved',
    tags: finalTags,
    user_id: null 
  }).select().single()

  if (error) throw new Error(`DB Save Failed: ${error.message}`)
  
  return saved
}

export async function deletePromptAction(id: string) {
  const supabase = await createClient()
  
  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 2. Check Admin Status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isAdmin = profile?.role === 'admin'

  // 3. Delete
  let query = supabase.from('prompts').delete().eq('id', id)
  
  if (!isAdmin) {
    query = query.eq('user_id', user.id) // Non-admins can only delete their own
  }

  const { error } = await query
  
  if (error) throw new Error("Failed to delete")
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function togglePromptPublicAction(id: string, intendedState: boolean) {
  const supabase = await createClient()
  
  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 2. Check if User is Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isAdmin = profile?.role === 'admin'

  // 3. LOGIC BRANCH: Admin vs User
  if (intendedState === false) {
    // A. Making Private? Anyone can do this instantly for their own prompts.
    // Admins can hide any prompt.
    let query = supabase
      .from('prompts')
      .update({ is_public: false }) // SECURITY: Removed invalid 'private' status
      .eq('id', id)

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { error } = await query

    if (error) throw new Error("Update failed")
    revalidatePath('/dashboard')
    return { status: 'private', message: "Made Private" }
  } 
  else {
    // B. Making Public?
    if (isAdmin) {
      // 🟢 Admin: Bypass Queue -> Live Instantly
      const { error } = await supabase
        .from('prompts')
        .update({ is_public: true, status: 'approved' })
        .eq('id', id)

      if (error) throw new Error("Update failed")
      revalidatePath('/dashboard')
      return { status: 'published', message: "Published (Admin Bypass)" }
    } else {
      // 🟡 User: Send to Queue -> Not Live Yet
      const { error } = await supabase
        .from('prompts')
        .update({ is_public: false, status: 'pending' }) // Keep private until approved
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw new Error("Update failed")
      revalidatePath('/dashboard')
      return { status: 'pending', message: "Submitted to Moderation Queue" }
    }
  }
}



export async function toggleLikeAction(promptId: string) {
  console.log('DEBUG: toggleLikeAction called', { promptId });
  try {
    const result = await toggleLike(promptId);
    // Note: We don't necessarily need revalidatePath here if we are using 
    // optimistic UI, but it's good practice to ensure the server state matches.
    // However, for high-frequency actions like 'Like', sometimes we skip it 
    // to avoid layout shifts or extra fetches if the client already knows the state.
    // In this case, let's keep it for data integrity.
    revalidatePath('/dashboard');
    return result;
  } catch (error: any) {
    console.error("toggleLikeAction Error:", error);
    throw new Error(error.message || "Failed to toggle like");
  }
}

export async function savePromptAction(prompt: RefinedPrompt, parentId?: string) {
  console.log('DEBUG: savePromptAction called', { parentId });
  // All auth, sanitization, and DB logic is centralised in savePromptToVault.
  // This action is a thin HTTP/Action boundary that triggers revalidation
  // after the secure service call succeeds.
  const saved = await savePromptToVault(prompt, parentId);

  revalidatePath('/dashboard');

  return saved;
}

export async function trackRemixAction(promptId: string) {
  try {
    await trackRemix(promptId);
    // We don't necessarily need revalidatePath here as we're doing optimistic UI
    // but it ensures the counts are eventually consistent on next load.
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error("trackRemixAction Error:", error);
    // Non-fatal, we don't throw so UI isn't blocked
  }
}