import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ugqvtsnayytwenhnwmgj.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncXZ0c25heXl0d2VuaG53bWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTM3MzYsImV4cCI6MjEwMzQyOTczNn0.N0Xk7dsvJDRnvjKqrEMaN1KEMcbRor8yHsDSb_5Ve04";

/**
 * Singleton Supabase client for use in both Server Components and API Routes.
 *
 * For authenticated flows you should create a per-request client using
 * createServerClient from `@supabase/ssr` instead.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

