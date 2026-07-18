import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildRevealPayload } from "@/lib/reveal";
import {
  MAX_CALL_STEP,
  callStepToConnectionStep,
  CALL_STEP,
} from "@/lib/steps";
import {
  clampScore,
  STEP_UNLOCK_REWARD,
  REVEALS_PER_DAY,
} from "@/lib/brackets";

// Mutual consent to move to the next step. Each participant posts their
// "yes"; the step only advances when BOTH flags are set. Nothing about
// the other person is revealed until that happens.
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
    .select(
      "id, participant_a, participant_b, unlock_step, step_unlocked_by_a, step_unlocked_by_b, ended_at",
    )
    .eq("id", callId)
    .maybeSingle();
  if (!call || call.ended_at) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  const isA = call.participant_a === user.id;
  const isB = call.participant_b === user.id;
  if (!isA && !isB) {
    return NextResponse.json({ error: "Not your call" }, { status: 403 });
  }
  if (call.unlock_step >= MAX_CALL_STEP) {
    return NextResponse.json({ step: call.unlock_step, both_agreed: true });
  }

  const myFlag = isA ? "step_unlocked_by_a" : "step_unlocked_by_b";
  const theirAgreed = isA ? call.step_unlocked_by_b : call.step_unlocked_by_a;

  if (!theirAgreed) {
    // First of the two — record consent and wait
    await admin.from("calls").update({ [myFlag]: true }).eq("id", callId);
    return NextResponse.json({ step: call.unlock_step, both_agreed: false });
  }

  // Both agreed — advance the step and reset flags for the next one
  const newStep = call.unlock_step + 1;

  // Photo reveals are budgeted: 2 per user per day. Check both sides
  // before the reveal happens; consume one credit each on success.
  if (newStep === CALL_STEP.PHOTO) {
    const today = new Date().toISOString().slice(0, 10);
    for (const id of [call.participant_a, call.participant_b]) {
      const { count } = await admin
        .from("reveal_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id)
        .eq("date", today);
      if ((count ?? 0) >= REVEALS_PER_DAY) {
        const mine = id === user.id;
        return NextResponse.json(
          {
            error: mine
              ? "You've used both reveals for today."
              : "They're out of reveals for today.",
            budget_exhausted: true,
          },
          { status: 429 },
        );
      }
    }
    await admin.from("reveal_events").insert([
      {
        user_id: call.participant_a,
        other_user_id: call.participant_b,
        call_id: callId,
        date: today,
      },
      {
        user_id: call.participant_b,
        other_user_id: call.participant_a,
        call_id: callId,
        date: today,
      },
    ]);
  }

  await admin
    .from("calls")
    .update({
      unlock_step: newStep,
      step_unlocked_by_a: false,
      step_unlocked_by_b: false,
    })
    .eq("id", callId);

  // Progressing through steps nudges behavioral score up for both
  for (const id of [call.participant_a, call.participant_b]) {
    const { data: u } = await admin
      .from("users")
      .select("behavioral_score")
      .eq("id", id)
      .single();
    if (u) {
      await admin
        .from("users")
        .update({
          behavioral_score: clampScore(
            (u.behavioral_score ?? 5) + STEP_UNLOCK_REWARD,
          ),
        })
        .eq("id", id);
    }
  }

  const otherId = isA ? call.participant_b : call.participant_a;
  const reveal = await buildRevealPayload(
    admin,
    otherId,
    callStepToConnectionStep(newStep),
  );

  return NextResponse.json({ step: newStep, both_agreed: true, reveal });
}
