import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendWindowNotification } from "@/lib/onesignal";

// Fires a window: one row in `windows` (applies to all brackets) plus a
// OneSignal push. Three windows a day — 9am, 8pm, and one at a random
// time. The random one is implemented by an hourly cron between 11:00
// and 19:00 that fires with probability 1/(remaining slots), which
// yields exactly one uniformly-random firing per day.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slot = url.searchParams.get("slot") ?? "manual";
  const admin = createAdminSupabase();

  if (slot === "random") {
    const RANDOM_SLOT_START = 11;
    const RANDOM_SLOT_END = 19; // last possible firing hour

    // Already fired a random window today? Then skip.
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { data: todayWindows } = await admin
      .from("windows")
      .select("id, fired_at")
      .gte("fired_at", dayStart.toISOString());
    const anchors = (todayWindows ?? []).filter((w) => {
      const h = new Date(w.fired_at).getHours();
      return h === 9 || h === 20;
    });
    if ((todayWindows ?? []).length - anchors.length > 0) {
      return NextResponse.json({ fired: false, reason: "already fired today" });
    }

    const hour = new Date().getHours();
    const remainingSlots = RANDOM_SLOT_END - hour + 1;
    if (hour > RANDOM_SLOT_END || hour < RANDOM_SLOT_START) {
      return NextResponse.json({ fired: false, reason: "outside slot range" });
    }
    if (hour < RANDOM_SLOT_END && Math.random() > 1 / remainingSlots) {
      return NextResponse.json({ fired: false, reason: "not this hour" });
    }
    // fall through and fire (always fires at the last slot if not yet fired)
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000);

  const { data: window, error } = await admin
    .from("windows")
    .insert({
      fired_at: now.toISOString(),
      expires_at: expires.toISOString(),
      bracket_tier: "all",
    })
    .select("id")
    .single();
  if (error || !window) {
    return NextResponse.json({ error: "Could not fire" }, { status: 500 });
  }

  try {
    await sendWindowNotification("Your window is open. You have 15 minutes.");
  } catch (e) {
    // Window still counts even if push delivery hiccups; realtime
    // subscribers will pick it up.
    console.error("OneSignal delivery failed", e);
  }

  return NextResponse.json({ fired: true, window_id: window.id, slot });
}
