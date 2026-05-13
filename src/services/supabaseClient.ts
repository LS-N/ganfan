import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { hasSupabaseConfig } from "./serviceMode"

let cachedClient: SupabaseClient | undefined

export function getSupabaseClient(env = process.env): SupabaseClient | undefined {
  if (!hasSupabaseConfig(env)) return undefined
  if (cachedClient) return cachedClient

  cachedClient = createClient(env.EXPO_PUBLIC_SUPABASE_URL as string, env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  })
  return cachedClient
}

export function resetSupabaseClientForTests() {
  cachedClient = undefined
}
