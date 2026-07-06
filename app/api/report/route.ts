import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

// The client never knows the other person's user id (anonymity), so
// reports reference the call or connection and we resolve the target here.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const { call_id, connection_id, reason } = body ?? {};
  if (!call_id && !connection_id) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  let reportedId: string | null = null;

  if (call_id) {
    const { data: call } = await admin
      .from("calls")
      .select("participant_a, participant_b")
      .eq("id", call_id)
      .maybeSingle();
    if (call && (call.participant_a === user.id || call.participant_b === user.id)) {
      reportedId =
        call.participant_a === user.id ? call.participant_b : call.participant_a;
    }
  } else if (connection_id) {
    const { data: conn } = await admin
      .from("connections")
      .select("user_a, user_b")
      .eq("id", connection_id)
      .maybeSingle();
    if (conn && (conn.user_a === user.id || conn.user_b === user.id)) {
      reportedId = conn.user_a === user.id ? conn.user_b : conn.user_a;
    }
  }

  if (!reportedId) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const { error } = await admin.from("reports").insert({
    reporter_id: user.id,
    reported_id: reportedId,
    reason: typeof reason === "string" ? reason.slice(0, 500) : null,
  });
  if (error) {
    return NextResponse.json({ error: "Could not report" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
