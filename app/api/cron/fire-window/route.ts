import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendWindowNotification } from "@/lib/onesignal";

const WINDOW_MINUTES = 60;
const SLOT_START = 10; // first possible firing hour (UTC)
const SLOT_END = 20; // last possible firing hour

// One window per day, at a random time. An hourly cron between
// SLOT_START and SLOT_END fires with probability 1/(remaining slots),
// which yields exactly one uniformly-random firing per day. The window
// stays open for 60 minutes.
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
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { count } = await admin
      .from("windows")
      .select("id", { count: "exact", head: true })
      .gte("fired_at", dayStart.toISOString());
    if ((count ?? 0) > 0) {
      return NextResponse.json({ fired: false, reason: "already fired today" });
    }

    const hour = new Date().getUTCHours();
    if (hour < SLOT_START || hour > SLOT_END) {
      return NextResponse.json({ fired: false, reason: "outside slot range" });
    }
    const remainingSlots = SLOT_END - hour + 1;
    if (hour < SLOT_END && Math.random() > 1 / remainingSlots) {
      return NextResponse.json({ fired: false, reason: "not this hour" });
    }
    // fall through and fire (guaranteed at the last slot if not yet fired)
  }

  const now = new Date();
  const expires = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);

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
    await sendWindowNotification("Your window is open. You have one hour.");
  } catch (e) {
    console.error("OneSignal delivery failed", e);
  }

  return NextResponse.json({ fired: true, window_id: window.id, slot });
}
