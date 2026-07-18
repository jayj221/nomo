// Vibe tags — used to rank the daily ten inside a bracket.
// Users pick 3–8 at onboarding. Overlap drives lineup ordering.

export const VIBE_TAGS = [
  // music
  "indie",
  "hip-hop",
  "techno",
  "r&b",
  "rock",
  "pop",
  "jazz",
  "classical",
  "desi",
  "latin",
  // mentality / vibe
  "deep talks",
  "dark humour",
  "ambitious",
  "spiritual",
  "bookworm",
  "film nerd",
  "gym rat",
  "foodie",
  "night owl",
  "early bird",
  "traveller",
  "homebody",
  "gamer",
  "artist",
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

export const MIN_TAGS = 3;
export const MAX_TAGS = 8;

export function tagOverlap(a: string[] | null, b: string[] | null): number {
  if (!a?.length || !b?.length) return 0;
  const setB = new Set(b);
  return a.filter((t) => setB.has(t)).length;
}
