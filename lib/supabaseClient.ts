// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for browser/frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for server-side operations with full permissions
// Only available on server-side (API routes, server components)
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : null
