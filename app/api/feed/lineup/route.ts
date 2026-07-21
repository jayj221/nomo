import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getPromptsFor } from "@/lib/feed";
import { ensureLineup } from "@/lib/lineup";

// Today's ten: same-bracket people ranked by vibe compatibility.
// Anonymous — prompts and tags only. No photos, names, or ages.
export async function GET() {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const admin = createAdminSupabase();
  const lineup = await ensureLineup(admin, user.id);

  const [{ data: myLikes }, { data: likesToMe }] = await Promise.all([
    admin.from("likes").select("to_user").eq("from_user", user.id),
    admin.from("likes").select("from_user").eq("to_user", user.id),
  ]);
  const likedSet = new Set((myLikes ?? []).map((r) => r.to_user));
  const likesMeSet = new Set((likesToMe ?? []).map((r) => r.from_user));

  const profiles = [];
  for (const entry of lineup) {
    const [prompts, { data: other }] = await Promise.all([
      getPromptsFor(admin, entry.matched_user_id),
      admin
        .from("users")
        .select("vibe_tags")
        .eq("id", entry.matched_user_id)
        .single(),
    ]);
    if (prompts.length < 2) continue;
    const liked = likedSet.has(entry.matched_user_id);
    profiles.push({
      profile_id: entry.matched_user_id,
      rank: entry.rank,
      prompts,
      vibe_tags: other?.vibe_tags ?? [],
      liked,
      mutual: liked && likesMeSet.has(entry.matched_user_id),
    });
  }

  await admin
    .from("users")
    .update({ last_active: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ profiles });
}
