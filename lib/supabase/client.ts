import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Always create a new client - the SSR package handles deduplication internally
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
