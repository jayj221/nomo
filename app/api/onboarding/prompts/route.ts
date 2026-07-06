import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { moderateText } from "@/lib/openai";
import {
  QUESTIONS,
  MAX_ANSWER_LENGTH,
  REQUIRED_PROMPT_COUNT,
} from "@/lib/questions";

interface PromptInput {
  question_key: string;
  answer: string;
  position: number;
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const prompts: PromptInput[] = body?.prompts;

  if (!Array.isArray(prompts) || prompts.length !== REQUIRED_PROMPT_COUNT) {
    return NextResponse.json({ error: "Pick exactly 3" }, { status: 400 });
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
  if (new Set(prompts.map((p) => p.question_key)).size !== 3) {
    return NextResponse.json(
      { error: "Pick 3 different questions" },
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
