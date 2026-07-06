// Bracket assignment logic. Server-side only — bracket_score and
// bracket_tier are never returned to the client in any API response.

export type BracketTier =
  | "0-4.5"
  | "4.5-6.0"
  | "6.0-7.5"
  | "7.5-9.0"
  | "9.0-10";

export function assignTier(score: number): BracketTier {
  if (score < 4.5) return "0-4.5";
  if (score < 6.0) return "4.5-6.0";
  if (score < 7.5) return "6.0-7.5";
  if (score < 9.0) return "7.5-9.0";
  return "9.0-10";
}

/** Average of the top 3 photo scores → bracket_score. */
export function bracketScoreFromPhotos(photoScores: number[]): number {
  const top3 = [...photoScores].sort((a, b) => b - a).slice(0, 3);
  const avg = top3.reduce((s, v) => s + v, 0) / top3.length;
  return Math.round(avg * 100) / 100;
}

// Behavioral score adjustments (0–10, starts at 5.0)
export const BEHAVIORAL_START = 5.0;
export const SKIP_TOO_FAST_PENALTY = 0.4; // skipped a call within 5 seconds
export const NO_PICKUP_PENALTY = 0.15; // opened window, never joined a call
export const CALL_COMPLETED_REWARD = 0.2;
export const STEP_UNLOCK_REWARD = 0.1;

export function clampScore(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v * 100) / 100));
}
