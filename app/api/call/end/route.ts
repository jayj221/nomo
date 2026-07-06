import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildRevealPayload, orderedPair } from "@/lib/reveal";
import {
  callStepToConnectionStep,
  FAST_SKIP_SECONDS,
  CALL_STEP,
} from "@/lib/steps";
import {
  clampScore,
  SKIP_TOO_FAST_PENALTY,
  CALL_COMPLETED_REWARD,
} from "@/lib/brackets";

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
    .select("id, participant_a, participant_b, started_at, ended_at, unlock_step")
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
  const connectionStep = callStepToConnectionStep(call.unlock_step);
  const [a, b] = orderedPair(call.participant_a, call.participant_b);

  // Idempotent: second participant ending the call just gets the summary
  if (call.ended_at) {
    const { data: conn } = await admin
      .from("connections")
      .select("id, unlock_step")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    const reveal = await buildRevealPayload(
      admin,
      otherId,
      conn?.unlock_step ?? connectionStep,
    );
    return NextResponse.json({
      connection_id: conn?.id ?? null,
      duration_seconds: Math.max(
        0,
        Math.round(
          (new Date(call.ended_at).getTime() -
            new Date(call.started_at).getTime()) /
            1000,
        ),
      ),
      unlock_step: conn?.unlock_step ?? connectionStep,
      reveal,
    });
  }

  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(call.started_at).getTime()) / 1000),
  );

  await admin
    .from("calls")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", callId);

  // Behavioral scoring: fast skips (likely voice/name bias) cost the
  // skipper; completed calls reward both.
  if (durationSeconds < FAST_SKIP_SECONDS) {
    const { data: u } = await admin
      .from("users")
      .select("behavioral_score")
      .eq("id", user.id)
      .single();
    if (u) {
      await admin
        .from("users")
        .update({
          behavioral_score: clampScore(
            (u.behavioral_score ?? 5) - SKIP_TOO_FAST_PENALTY,
          ),
        })
        .eq("id", user.id);
    }
  } else if (durationSeconds >= 120) {
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
              (u.behavioral_score ?? 5) + CALL_COMPLETED_REWARD,
            ),
          })
          .eq("id", id);
      }
    }
  }

  // Persist the connection at the step the call reached (never downgrade)
  const { data: existing } = await admin
    .from("connections")
    .select("id, unlock_step")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();

  const finalStep = Math.max(existing?.unlock_step ?? 1, connectionStep);
  const chatEnabled = call.unlock_step >= CALL_STEP.CHAT;

  let connectionId: string;
  if (existing) {
    await admin
      .from("connections")
      .update({
        unlock_step: finalStep,
        chat_enabled: chatEnabled || undefined,
      })
      .eq("id", existing.id);
    connectionId = existing.id;
  } else {
    const { data: created, error } = await admin
      .from("connections")
      .insert({
        user_a: a,
        user_b: b,
        unlock_step: finalStep,
        chat_enabled: chatEnabled,
      })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json(
        { error: "Could not save connection" },
        { status: 500 },
      );
    }
    connectionId = created.id;
  }

  const reveal = await buildRevealPayload(admin, otherId, finalStep);

  return NextResponse.json({
    connection_id: connectionId,
    duration_seconds: durationSeconds,
    unlock_step: finalStep,
    reveal,
  });
}
