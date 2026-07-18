// Bracket assignment logic. A user's bracket (1–10) is computed from
// facial-geometry scoring at onboarding. It is shown ONCE to the user
// themselves, then never again — and never to anyone else.

export type BracketTier = number; // integer 1–10

export function assignTier(score: number): BracketTier {
  return Math.max(1, Math.min(10, Math.round(score)));
}

/** Average of the top 3 photo scores → bracket_score. */
export function bracketScoreFromPhotos(photoScores: number[]): number {
  const top3 = [...photoScores].sort((a, b) => b - a).slice(0, 3);
  const avg = top3.reduce((s, v) => s + v, 0) / top3.length;
  return Math.round(avg * 100) / 100;
}

// Daily reveal budget: each user can be part of at most 2 photo
// reveals per day. Scarcity is the product.
export const REVEALS_PER_DAY = 2;

// Behavioral score adjustments (0–10, starts at 5.0)
export const BEHAVIORAL_START = 5.0;
export const SKIP_TOO_FAST_PENALTY = 0.4; // skipped a call within 5 seconds
export const NO_PICKUP_PENALTY = 0.15; // opened window, never joined a call
export const CALL_COMPLETED_REWARD = 0.2;
export const STEP_UNLOCK_REWARD = 0.1;

export function clampScore(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v * 100) / 100));
}
