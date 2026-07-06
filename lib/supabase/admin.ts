import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — server-side only. This is the ONLY
// path that may read bracket_score / bracket_tier / behavioral_score, and
// those values must never be included in a response payload.
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
