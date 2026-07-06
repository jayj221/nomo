import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { REQUIRED_PROMPT_COUNT } from "@/lib/questions";

// Marks liveness verified after the client-side MediaPipe check passes,
// and completes onboarding if every other gate is satisfied.
export async function POST() {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const admin = createAdminSupabase();

  const [{ count: photoCount }, { count: promptCount }, { data: profile }] =
    await Promise.all([
      admin
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("ai_score", "is", null),
      admin
        .from("prompts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("moderated", true),
      admin
        .from("users")
        .select("first_name, age, city, gender, seeking, bracket_tier")
        .eq("id", user.id)
        .single(),
    ]);

  const profileComplete =
    profile?.first_name && profile?.age && profile?.city && profile?.gender &&
    (profile?.seeking?.length ?? 0) > 0;

  if (
    (photoCount ?? 0) < 2 ||
    (promptCount ?? 0) < REQUIRED_PROMPT_COUNT ||
    !profileComplete ||
    !profile?.bracket_tier
  ) {
    return NextResponse.json(
      { error: "Finish the earlier steps first" },
      { status: 400 },
    );
  }

  const { error } = await admin
    .from("users")
    .update({
      liveness_verified: true,
      onboarding_complete: true,
      last_active: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
