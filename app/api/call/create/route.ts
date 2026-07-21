import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createRoom, createMeetingToken } from "@/lib/daily";

const MAX_CALLS_PER_WINDOW = 3;

function roomNameFromUrl(url: string): string {
  return new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const otherUserId: string = body?.other_user_id;
  const windowId: string = body?.window_id;
  // Voice is the default and the emphasis; text is allowed.
  const mode: "voice" | "text" = body?.mode === "text" ? "text" : "voice";
  if (!otherUserId || !windowId || otherUserId === user.id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // Window must still be open
  const { data: window } = await admin
    .from("windows")
    .select("id, expires_at")
    .eq("id", windowId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!window) {
    return NextResponse.json({ error: "The window has closed" }, { status: 410 });
  }

  // Calls only fire between mutual likes — never one-sided
  const [{ data: myLike }, { data: theirLike }] = await Promise.all([
    admin.from("likes").select("id").eq("from_user", user.id).eq("to_user", otherUserId).maybeSingle(),
    admin.from("likes").select("id").eq("from_user", otherUserId).eq("to_user", user.id).maybeSingle(),
  ]);
  if (!myLike || !theirLike) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  // Rate limit: max 3 calls per window
  const { count } = await admin
    .from("calls")
    .select("id", { count: "exact", head: true })
    .eq("window_id", windowId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);
  if ((count ?? 0) >= MAX_CALLS_PER_WINDOW) {
    return NextResponse.json(
      { error: "You've reached your calls for this window" },
      { status: 429 },
    );
  }

  // If a live call already exists for this pair in this window, join it
  // (the second person to tap gets the same room, their own token).
  const { data: existing } = await admin
    .from("calls")
    .select("id, room_url, unlock_step, mode")
    .eq("window_id", windowId)
    .is("ended_at", null)
    .or(
      `and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),` +
        `and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`,
    )
    .maybeSingle();

  if (existing) {
    // The initiator chose the mode; the joiner lands in the same session.
    const token =
      existing.mode === "voice" && existing.room_url
        ? await createMeetingToken(roomNameFromUrl(existing.room_url), user.id)
        : null;
    return NextResponse.json({
      call_id: existing.id,
      mode: existing.mode,
      room_url: existing.room_url,
      token,
      unlock_step: existing.unlock_step,
    });
  }

  // Text sessions need no Daily room — realtime broadcast carries them.
  const room = mode === "voice" ? await createRoom() : null;
  const token =
    room !== null ? await createMeetingToken(room.name, user.id) : null;

  const { data: call, error } = await admin
    .from("calls")
    .insert({
      mode,
      room_url: room?.url ?? null,
      participant_a: user.id,
      participant_b: otherUserId,
      window_id: windowId,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !call) {
    return NextResponse.json({ error: "Could not start call" }, { status: 500 });
  }

  // Nudge the other participant's client over realtime broadcast
  const channel = admin.channel(`user:${otherUserId}`);
  await channel.send({
    type: "broadcast",
    event: "incoming-call",
    payload: { call_id: call.id, mode, window_id: windowId },
  });
  await admin.removeChannel(channel);

  return NextResponse.json({
    call_id: call.id,
    mode,
    room_url: room?.url ?? null,
    token,
    unlock_step: 1,
  });
}
