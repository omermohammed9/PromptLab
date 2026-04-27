
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function test() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Env vars missing')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  try {
    const { error } = await supabase.from('profiles').select('count').single()
    if (error) {
      console.error('Profiles table error:', error.message)
    } else {
      console.log('Profiles table exists')
    }
    
    const { error: promptsError } = await supabase.from('prompts').select('count').single()
    if (promptsError) {
      console.error('Prompts table error:', promptsError.message)
    } else {
      console.log('Prompts table exists')
    }
  } catch (err) {
    console.error('Test failed:', err)
  }
}

test()
