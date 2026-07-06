import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnonymousPrompt } from "@/types/app.types";
import { questionText } from "@/lib/questions";

export const DAILY_LIKE_LIMIT = 10;
export const DAILY_QUEUE_LIMIT = 10;

export async function getPromptsFor(
  admin: SupabaseClient,
  userId: string,
): Promise<AnonymousPrompt[]> {
  const { data } = await admin
    .from("prompts")
    .select("question_key, answer, position")
    .eq("user_id", userId)
    .eq("moderated", true)
    .eq("flagged", false)
    .order("position");
  return (data ?? []).map((p) => ({
    question_key: p.question_key,
    question: questionText(p.question_key),
    answer: p.answer,
  }));
}

interface Preferences {
  gender: string | null;
  seeking: string[] | null;
}

/** Both people must be looking for each other's gender. */
export function mutuallyCompatible(a: Preferences, b: Preferences): boolean {
  if (!a.gender || !b.gender || !a.seeking || !b.seeking) return false;
  return a.seeking.includes(b.gender) && b.seeking.includes(a.gender);
}

export function todayStartISO(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
