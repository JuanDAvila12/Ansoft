import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This client is used for public/anonymous operations (no auth context)
// For auth-aware operations in server components, use createServerComponentClient from @supabase/auth-helpers-nextjs
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
