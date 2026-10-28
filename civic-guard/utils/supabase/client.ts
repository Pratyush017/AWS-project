import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ugqvtsnayytwenhnwmgj.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncXZ0c25heXl0d2VuaG53bWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTM3MzYsImV4cCI6MjEwMzQyOTczNn0.N0Xk7dsvJDRnvjKqrEMaN1KEMcbRor8yHsDSb_5Ve04";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
