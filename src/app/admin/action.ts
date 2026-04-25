"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function moderatePromptAction(id: string, decision: 'approved' | 'rejected') {
  const supabase = createClient();
  
  // 1. Check Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  // 2. Check Admin Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error("Forbidden: Only Admins can perform this action");
  }

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
