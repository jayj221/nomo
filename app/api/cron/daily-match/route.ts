import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { mutuallyCompatible, todayDate } from "@/lib/feed";
import { orderedPair } from "@/lib/reveal";

// Runs at 7:50am daily. For every active user, pick their one daily
// curated profile:
//  1. mutual likes with no connection yet — highest combined
//     (bracket_score + behavioral_score) similarity
//  2. otherwise: same bracket tier, never shown before, ranked by
//     behavioral_score proximity
export async function GET(request: Request) {
  const secret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const date = todayDate();

  const { data: activeUsers } = await admin
    .from("users")
    .select("id, bracket_tier, bracket_score, behavioral_score, gender, seeking")
    .eq("onboarding_complete", true)
    .eq("liveness_verified", true)
    .gte(
      "last_active",
      new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    );

  const { data: allLikes } = await admin
    .from("likes")
    .select("from_user, to_user");
  const { data: allConnections } = await admin
    .from("connections")
    .select("user_a, user_b");
  const { data: shownBefore } = await admin
    .from("daily_match")
    .select("user_id, matched_user_id");
  const { data: existingToday } = await admin
    .from("daily_match")
    .select("user_id")
    .eq("date", date);

  const likeSet = new Set(
    (allLikes ?? []).map((l) => `${l.from_user}:${l.to_user}`),
  );
  const connSet = new Set(
    (allConnections ?? []).map((c) => `${c.user_a}:${c.user_b}`),
  );
  const shownSet = new Set(
    (shownBefore ?? []).map((s) => `${s.user_id}:${s.matched_user_id}`),
  );
  const alreadyAssigned = new Set((existingToday ?? []).map((r) => r.user_id));

  let assigned = 0;
  for (const me of activeUsers ?? []) {
    if (alreadyAssigned.has(me.id)) continue;

    let pick: string | null = null;

    // 1. Mutual likes without a connection
    const mutuals = (activeUsers ?? []).filter((c) => {
      if (c.id === me.id) return false;
      if (!likeSet.has(`${me.id}:${c.id}`) || !likeSet.has(`${c.id}:${me.id}`))
        return false;
      const [a, b] = orderedPair(me.id, c.id);
      return !connSet.has(`${a}:${b}`);
    });
    if (mutuals.length > 0) {
      mutuals.sort(
        (x, y) =>
          Math.abs(
            (x.bracket_score ?? 5) + (x.behavioral_score ?? 5) -
              ((me.bracket_score ?? 5) + (me.behavioral_score ?? 5)),
          ) -
          Math.abs(
            (y.bracket_score ?? 5) + (y.behavioral_score ?? 5) -
              ((me.bracket_score ?? 5) + (me.behavioral_score ?? 5)),
          ),
      );
      pick = mutuals[0].id;
    } else {
      // 2. Fresh profiles in the same bracket, never shown before
      const fresh = (activeUsers ?? [])
        .filter(
          (c) =>
            c.id !== me.id &&
            c.bracket_tier === me.bracket_tier &&
            !shownSet.has(`${me.id}:${c.id}`) &&
            mutuallyCompatible(me, c),
        )
        .sort(
          (x, y) =>
            Math.abs((x.behavioral_score ?? 5) - (me.behavioral_score ?? 5)) -
            Math.abs((y.behavioral_score ?? 5) - (me.behavioral_score ?? 5)),
        );
      if (fresh.length > 0) pick = fresh[0].id;
    }

    if (pick) {
      await admin
        .from("daily_match")
        .upsert(
          { user_id: me.id, matched_user_id: pick, date },
          { onConflict: "user_id,date" },
        );
      assigned++;
    }
  }

  return NextResponse.json({ ok: true, assigned, date });
}
