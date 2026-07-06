import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createMeetingToken } from "@/lib/daily";

// Fetch room + a fresh token for a call you're a participant of.
// Used by the callee (who learns the call id over realtime) and on
// reconnects.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const callId: string = body?.call_id;
  if (!callId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: call } = await admin
    .from("calls")
    .select("id, room_url, participant_a, participant_b, unlock_step, ended_at")
    .eq("id", callId)
    .maybeSingle();
  if (!call || call.ended_at) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (call.participant_a !== user.id && call.participant_b !== user.id) {
    return NextResponse.json({ error: "Not your call" }, { status: 403 });
  }

  const roomName =
    new URL(call.room_url).pathname.split("/").filter(Boolean).pop() ?? "";
  const token = await createMeetingToken(roomName, user.id);

  return NextResponse.json({
    call_id: call.id,
    room_url: call.room_url,
    token,
    unlock_step: call.unlock_step,
  });
}
