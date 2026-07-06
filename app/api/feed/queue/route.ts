import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  getPromptsFor,
  mutuallyCompatible,
  todayStartISO,
  DAILY_QUEUE_LIMIT,
} from "@/lib/feed";
import type { AnonymousProfile } from "@/types/app.types";

export async function GET() {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const admin = createAdminSupabase();

  const { data: me } = await admin
    .from("users")
    .select("bracket_tier, behavioral_score, gender, seeking")
    .eq("id", user.id)
    .single();
  if (!me?.bracket_tier) {
    return NextResponse.json({ profiles: [], remaining: 0 });
  }

  // Hard cap: 10 per day. Every like/pass today counts against it.
  const [{ count: likesToday }, { count: passesToday }] = await Promise.all([
    admin
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("from_user", user.id)
      .gte("created_at", todayStartISO()),
    admin
      .from("passes")
      .select("id", { count: "exact", head: true })
      .eq("from_user", user.id)
      .gte("created_at", todayStartISO()),
  ]);
  const remaining = Math.max(
    0,
    DAILY_QUEUE_LIMIT - (likesToday ?? 0) - (passesToday ?? 0),
  );
  if (remaining === 0) {
    return NextResponse.json({ profiles: [], remaining: 0 });
  }

  // Everyone I've already acted on is out of the pool
  const [{ data: liked }, { data: passed }] = await Promise.all([
    admin.from("likes").select("to_user").eq("from_user", user.id),
    admin.from("passes").select("to_user").eq("from_user", user.id),
  ]);
  const excluded = new Set([
    user.id,
    ...(liked ?? []).map((r) => r.to_user),
    ...(passed ?? []).map((r) => r.to_user),
  ]);

  // Same bracket tier only. Ranking: behavioral_score proximity.
  const { data: candidates } = await admin
    .from("users")
    .select("id, gender, seeking, behavioral_score")
    .eq("bracket_tier", me.bracket_tier)
    .eq("onboarding_complete", true)
    .eq("liveness_verified", true)
    .neq("id", user.id)
    .limit(200);

  const ranked = (candidates ?? [])
    .filter((c) => !excluded.has(c.id) && mutuallyCompatible(me, c))
    .sort(
      (a, b) =>
        Math.abs((a.behavioral_score ?? 5) - (me.behavioral_score ?? 5)) -
        Math.abs((b.behavioral_score ?? 5) - (me.behavioral_score ?? 5)),
    )
    .slice(0, remaining);

  const profiles: AnonymousProfile[] = [];
  for (const c of ranked) {
    const prompts = await getPromptsFor(admin, c.id);
    if (prompts.length === 3) {
      profiles.push({ profile_id: c.id, prompts, liked: false, mutual: false });
    }
  }

  return NextResponse.json({ profiles, remaining });
}
