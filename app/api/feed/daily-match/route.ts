import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getPromptsFor, todayDate } from "@/lib/feed";
import type { DailyMatchPayload } from "@/types/app.types";

export async function GET() {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const admin = createAdminSupabase();

  const { data: match } = await admin
    .from("daily_match")
    .select("id, matched_user_id, revealed")
    .eq("user_id", user.id)
    .eq("date", todayDate())
    .maybeSingle();

  if (!match) {
    const payload: DailyMatchPayload = { match: null, state: "none" };
    return NextResponse.json(payload);
  }

  const otherId = match.matched_user_id;

  const [prompts, { data: myLike }, { data: theirLike }, { data: myPass }] =
    await Promise.all([
      getPromptsFor(admin, otherId),
      admin
        .from("likes")
        .select("id")
        .eq("from_user", user.id)
        .eq("to_user", otherId)
        .maybeSingle(),
      admin
        .from("likes")
        .select("id")
        .eq("from_user", otherId)
        .eq("to_user", user.id)
        .maybeSingle(),
      admin
        .from("passes")
        .select("id")
        .eq("from_user", user.id)
        .eq("to_user", otherId)
        .maybeSingle(),
    ]);

  if (!match.revealed) {
    await admin.from("daily_match").update({ revealed: true }).eq("id", match.id);
  }

  const liked = Boolean(myLike);
  const mutual = liked && Boolean(theirLike);
  const state = myPass ? "passed" : mutual ? "mutual" : liked ? "liked" : "fresh";

  const payload: DailyMatchPayload = {
    match: { profile_id: otherId, prompts, liked, mutual },
    state,
  };
  return NextResponse.json(payload);
}
