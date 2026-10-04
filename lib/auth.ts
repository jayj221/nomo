import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface AuthedContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Resolve the calling user in an API route, or a 401 response.
 *
 * The web app authenticates by cookie. The Expo client has no cookie jar and
 * carries its Supabase session as a bearer token, so fall back to that. Both
 * paths verify the token with Supabase and both stay under RLS; this only
 * changes where the session is read from.
 */
export async function requireUser(): Promise<AuthedContext | NextResponse> {
  const cookieClient = createServerSupabase();
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser();
  if (cookieUser) return { user: cookieUser, supabase: cookieClient };

  const bearer = headers().get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const tokenClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: bearer } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const {
      data: { user: tokenUser },
    } = await tokenClient.auth.getUser();
    if (tokenUser) return { user: tokenUser, supabase: tokenClient };
  }

  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}
