import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ensureLineup } from "@/lib/lineup";

// Runs daily before the day starts: build every active user's ranked
// lineup of ten. The lineup endpoint also builds on demand, so this
// cron is a warm-up, not a single point of failure.
export async function GET(request: Request) {
  const secret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data: activeUsers } = await admin
    .from("users")
    .select("id")
    .eq("onboarding_complete", true)
    .eq("liveness_verified", true)
    .gte(
      "last_active",
      new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    );

  let built = 0;
  for (const u of activeUsers ?? []) {
    const lineup = await ensureLineup(admin, u.id);
    if (lineup.length > 0) built++;
  }

  return NextResponse.json({ ok: true, built });
}
