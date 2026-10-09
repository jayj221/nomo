import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { moderateText } from "@/lib/openai";
import {
  QUESTIONS,
  MAX_ANSWER_LENGTH,
  MIN_PROMPTS,
  MAX_PROMPTS,
  questionText,
} from "@/lib/questions";

interface PromptInput {
  question_key: string;
  answer: string;
  position: number;
}

/**
 * The caller's own prompts, in order. Used by the mobile client to show a
 * person what others currently meet them as. Reads under the caller's own
 * session, so RLS keeps it to their rows; unlike the lineup it is not
 * anonymised, because these answers are already theirs.
 */
export async function GET() {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const { data } = await supabase
    .from("prompts")
    .select("question_key, answer, position, moderated, flagged")
    .eq("user_id", user.id)
    .order("position");

  const prompts = (data ?? []).map((p) => ({
    question_key: p.question_key,
    question: questionText(p.question_key),
    answer: p.answer,
    position: p.position,
    // Shown to its author either way, but the author should know when an
    // answer is not yet visible to anyone else.
    pending: !p.moderated || p.flagged,
  }));

  return NextResponse.json({ prompts });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const prompts: PromptInput[] = body?.prompts;

  if (
    !Array.isArray(prompts) ||
    prompts.length < MIN_PROMPTS ||
    prompts.length > MAX_PROMPTS
  ) {
    return NextResponse.json(
      { error: `Pick ${MIN_PROMPTS}–${MAX_PROMPTS}` },
      { status: 400 },
    );
  }

  const validKeys = new Set(QUESTIONS.map((q) => q.key as string));
  for (const p of prompts) {
    if (!validKeys.has(p.question_key)) {
      return NextResponse.json({ error: "Unknown question" }, { status: 400 });
    }
    if (
      typeof p.answer !== "string" ||
      !p.answer.trim() ||
      p.answer.length > MAX_ANSWER_LENGTH
    ) {
      return NextResponse.json(
        { error: `Answers must be 1–${MAX_ANSWER_LENGTH} characters` },
        { status: 400 },
      );
    }
  }
  if (new Set(prompts.map((p) => p.question_key)).size !== prompts.length) {
    return NextResponse.json(
      { error: "Pick different questions" },
      { status: 400 },
    );
  }

  // Moderate every answer before anything goes live
  const flaggedPositions: number[] = [];
  for (const p of prompts) {
    const result = await moderateText(p.answer);
    if (result.flagged) flaggedPositions.push(p.position);
  }
  if (flaggedPositions.length > 0) {
    return NextResponse.json(
      {
        error: "That answer won't work here. Try again.",
        flagged_positions: flaggedPositions,
      },
      { status: 422 },
    );
  }

  await supabase.from("prompts").delete().eq("user_id", user.id);
  const { error } = await supabase.from("prompts").insert(
    prompts.map((p, i) => ({
      user_id: user.id,
      question_key: p.question_key,
      answer: p.answer.trim(),
      position: i + 1,
      moderated: true,
      flagged: false,
    })),
  );
  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
