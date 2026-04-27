import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmbedding } from '@/lib/ai/embeddings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  // 1. SECURITY: Verify Admin Status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  // 2. FETCH: Get prompts without embeddings
  const { data: prompts, error: fetchError } = await supabase
    .from('prompts')
    .select('id, title, content, explanation')
    .is('embedding', null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!prompts || prompts.length === 0) {
    return NextResponse.json({ message: "No prompts need backfilling." });
  }

  // 3. PROCESS: Generate embeddings and update
  const results = {
    total: prompts.length,
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const prompt of prompts) {
    try {
      const textToEmbed = `${prompt.title || ''} ${prompt.content} ${prompt.explanation || ''}`;
      const embedding = await getEmbedding(textToEmbed);

      if (embedding && embedding.length > 0) {
        const { error: updateError } = await supabase
          .from('prompts')
          .update({ embedding })
          .eq('id', prompt.id);

        if (updateError) {
          results.failed++;
          results.errors.push(`ID ${prompt.id}: ${updateError.message}`);
        } else {
          results.success++;
        }
      } else {
        results.failed++;
        results.errors.push(`ID ${prompt.id}: Embedding generation returned empty.`);
      }
    } catch (err: any) {
      results.failed++;
      results.errors.push(`ID ${prompt.id}: ${err.message}`);
    }
  }

  return NextResponse.json({
    message: "Backfill process complete",
    stats: results
  });
}
