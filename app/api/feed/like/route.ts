import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { todayStartISO, DAILY_LIKE_LIMIT } from "@/lib/feed";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const profileId: string = body?.profile_id;
  if (!profileId || profileId === user.id) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // Rate limit: max 10 likes per day
  const { count } = await admin
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("from_user", user.id)
    .gte("created_at", todayStartISO());
  if ((count ?? 0) >= DAILY_LIKE_LIMIT) {
    return NextResponse.json(
      { error: "That's everyone for today. Come back tomorrow." },
      { status: 429 },
    );
  }

  const { error } = await supabase
    .from("likes")
    .upsert(
      { from_user: user.id, to_user: profileId },
      { onConflict: "from_user,to_user" },
    );
  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  // Mutual check needs admin — RLS only exposes likes the caller sent
  const { data: reverse } = await admin
    .from("likes")
    .select("id")
    .eq("from_user", profileId)
    .eq("to_user", user.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, mutual: Boolean(reverse) });
}
