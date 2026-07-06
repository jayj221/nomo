import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { CONNECTION_STEP } from "@/lib/steps";

const PLATFORMS = ["instagram", "tiktok", "spotify", "apple_music"];

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const { connection_id, platform, handle } = body ?? {};
  if (
    !connection_id ||
    !PLATFORMS.includes(platform) ||
    typeof handle !== "string" ||
    !handle.trim() ||
    handle.length > 100
  ) {
    return NextResponse.json({ error: "Invalid share" }, { status: 400 });
  }

  // Socials only exist at step 5
  const { data: conn } = await supabase
    .from("connections")
    .select("id, unlock_step, chat_enabled")
    .eq("id", connection_id)
    .maybeSingle();
  if (!conn || conn.unlock_step < CONNECTION_STEP.CHAT_SOCIALS || !conn.chat_enabled) {
    return NextResponse.json({ error: "Not available yet" }, { status: 403 });
  }

  const { error } = await supabase.from("social_shares").upsert(
    {
      connection_id,
      user_id: user.id,
      platform,
      handle: handle.trim().replace(/^@/, ""),
    },
    { onConflict: "connection_id,user_id,platform" },
  );
  if (error) {
    return NextResponse.json({ error: "Could not share" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
