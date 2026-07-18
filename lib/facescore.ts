// Facial-geometry scoring: MediaPipe FaceLandmarker landmarks →
// symmetry + proportion metrics → 1–10 score.
//
// Honest engineering note: this is a heuristic, not a measurement of
// beauty. "Golden ratio" facial math has no scientific standing and
// landmark models carry demographic bias. It exists to place users in
// brackets; the number is shown once, to the owner only.
//
// Pure functions over {x, y} points so the whole thing is unit-testable.
// Runs client-side (we already ship MediaPipe for the liveness check).

export interface Point {
  x: number;
  y: number;
}

// MediaPipe FaceLandmarker canonical indices we rely on
export const LM = {
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  NOSE_TIP: 1,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  CHIN: 152,
  FOREHEAD: 10,
  FACE_LEFT: 234,
  FACE_RIGHT: 454,
} as const;

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface FaceMetrics {
  symmetry: number; // 0–1, 1 = perfectly mirrored
  eyeSpacing: number; // inner-eye gap / face width
  faceRatio: number; // face height / face width
  mouthNoseBalance: number; // mouth width / eye-outer span
}

/**
 * Compute geometry metrics from the 478-point landmark array.
 * Only ratios are used, so scale and position cancel out.
 */
export function computeMetrics(pts: Point[]): FaceMetrics {
  const faceL = pts[LM.FACE_LEFT];
  const faceR = pts[LM.FACE_RIGHT];
  const width = dist(faceL, faceR);
  const height = dist(pts[LM.FOREHEAD], pts[LM.CHIN]);
  const midX = (faceL.x + faceR.x) / 2;

  // Symmetry: mirror paired features across the face midline and
  // measure the error relative to face width.
  const pairs: [number, number][] = [
    [LM.LEFT_EYE_OUTER, LM.RIGHT_EYE_OUTER],
    [LM.LEFT_EYE_INNER, LM.RIGHT_EYE_INNER],
    [LM.MOUTH_LEFT, LM.MOUTH_RIGHT],
    [LM.FACE_LEFT, LM.FACE_RIGHT],
  ];
  let err = 0;
  for (const [l, r] of pairs) {
    const dl = Math.abs(midX - pts[l].x);
    const dr = Math.abs(pts[r].x - midX);
    err += Math.abs(dl - dr) / width;
    err += Math.abs(pts[l].y - pts[r].y) / width;
  }
  const symmetry = Math.max(0, 1 - err * 2.5);

  return {
    symmetry,
    eyeSpacing: dist(pts[LM.LEFT_EYE_INNER], pts[LM.RIGHT_EYE_INNER]) / width,
    faceRatio: height / width,
    mouthNoseBalance:
      dist(pts[LM.MOUTH_LEFT], pts[LM.MOUTH_RIGHT]) /
      dist(pts[LM.LEFT_EYE_OUTER], pts[LM.RIGHT_EYE_OUTER]),
  };
}

/** How close v is to target, mapped to 0–1 with a tolerance band. */
function closeness(v: number, target: number, tolerance: number): number {
  return Math.max(0, 1 - Math.abs(v - target) / tolerance);
}

/**
 * Metrics → 1–10. Symmetry dominates; proportion terms measure
 * distance from population-typical ratios.
 */
export function scoreFromMetrics(m: FaceMetrics): number {
  const proportions =
    (closeness(m.eyeSpacing, 0.25, 0.12) +
      closeness(m.faceRatio, 1.3, 0.45) +
      closeness(m.mouthNoseBalance, 0.75, 0.3)) /
    3;
  const raw = 0.55 * m.symmetry + 0.45 * proportions; // 0–1
  return Math.max(1, Math.min(10, Math.round(raw * 9 + 1)));
}

export function scoreFace(pts: Point[]): number {
  return scoreFromMetrics(computeMetrics(pts));
}
