import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface AuthedContext {
  user: User;
  supabase: SupabaseClient;
}

/** Resolve the calling user in an API route, or a 401 response. */
export async function requireUser(): Promise<AuthedContext | NextResponse> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return { user, supabase };
}

export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}
