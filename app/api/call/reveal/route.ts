import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildRevealPayload } from "@/lib/reveal";
import { callStepToConnectionStep } from "@/lib/steps";

// What the caller may currently see about the other participant,
// strictly gated by the call's unlock step. Used when the realtime
// subscription reports a step change that the other side initiated.
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
    .select("participant_a, participant_b, unlock_step")
    .eq("id", callId)
    .maybeSingle();
  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (call.participant_a !== user.id && call.participant_b !== user.id) {
    return NextResponse.json({ error: "Not your call" }, { status: 403 });
  }

  const otherId =
    call.participant_a === user.id ? call.participant_b : call.participant_a;
  const reveal = await buildRevealPayload(
    admin,
    otherId,
    callStepToConnectionStep(call.unlock_step),
  );
  return NextResponse.json({ step: call.unlock_step, reveal });
}
