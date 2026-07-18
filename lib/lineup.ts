import type { SupabaseClient } from "@supabase/supabase-js";
import { mutuallyCompatible, todayDate } from "@/lib/feed";
import { tagOverlap } from "@/lib/tags";

export const LINEUP_SIZE = 10;

interface CandidateRow {
  id: string;
  bracket_tier: number | null;
  behavioral_score: number | null;
  gender: string | null;
  seeking: string[] | null;
  vibe_tags: string[] | null;
}

/**
 * Rank candidates for a user: same bracket only, mutually compatible,
 * ordered by vibe-tag overlap (desc), then behavioral-score proximity.
 * rank 1 = most compatible.
 */
export function rankCandidates(
  me: CandidateRow,
  candidates: CandidateRow[],
  excludeIds: Set<string>,
): CandidateRow[] {
  return candidates
    .filter(
      (c) =>
        c.id !== me.id &&
        !excludeIds.has(c.id) &&
        c.bracket_tier != null &&
        c.bracket_tier === me.bracket_tier &&
        mutuallyCompatible(me, c),
    )
    .sort((a, b) => {
      const overlapDiff =
        tagOverlap(me.vibe_tags, b.vibe_tags) -
        tagOverlap(me.vibe_tags, a.vibe_tags);
      if (overlapDiff !== 0) return overlapDiff;
      return (
        Math.abs((a.behavioral_score ?? 5) - (me.behavioral_score ?? 5)) -
        Math.abs((b.behavioral_score ?? 5) - (me.behavioral_score ?? 5))
      );
    })
    .slice(0, LINEUP_SIZE);
}

/**
 * Ensure today's lineup exists for a user; build and persist it if not.
 * Returns the ranked matched_user_ids.
 */
export async function ensureLineup(
  admin: SupabaseClient,
  userId: string,
): Promise<{ matched_user_id: string; rank: number }[]> {
  const date = todayDate();

  const { data: existing } = await admin
    .from("daily_match")
    .select("matched_user_id, rank")
    .eq("user_id", userId)
    .eq("date", date)
    .order("rank");
  if (existing && existing.length > 0) return existing;

  const { data: me } = await admin
    .from("users")
    .select("id, bracket_tier, behavioral_score, gender, seeking, vibe_tags")
    .eq("id", userId)
    .single();
  if (!me?.bracket_tier) return [];

  // People shown on previous days can appear again only after everyone
  // else in the bracket has been cycled — simplest form: exclude the
  // last 3 days of lineups.
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const { data: recent } = await admin
    .from("daily_match")
    .select("matched_user_id")
    .eq("user_id", userId)
    .gte("date", threeDaysAgo);
  const exclude = new Set((recent ?? []).map((r) => r.matched_user_id));

  const { data: candidates } = await admin
    .from("users")
    .select("id, bracket_tier, behavioral_score, gender, seeking, vibe_tags")
    .eq("bracket_tier", me.bracket_tier)
    .eq("onboarding_complete", true)
    .eq("liveness_verified", true)
    .neq("id", userId)
    .limit(400);

  const ranked = rankCandidates(me, candidates ?? [], exclude);
  if (ranked.length === 0) return [];

  const rows = ranked.map((c, i) => ({
    user_id: userId,
    matched_user_id: c.id,
    date,
    rank: i + 1,
  }));
  await admin
    .from("daily_match")
    .upsert(rows, { onConflict: "user_id,date,rank" });

  return rows.map(({ matched_user_id, rank }) => ({ matched_user_id, rank }));
}
