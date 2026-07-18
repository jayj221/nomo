import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  scoreFromMetrics,
  scoreFace,
  LM,
  type Point,
} from "@/lib/facescore";

// Build a synthetic 478-point landmark array with a controllable,
// population-typical face geometry.
function syntheticFace(opts?: { skew?: number }): Point[] {
  const skew = opts?.skew ?? 0;
  const pts: Point[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  pts[LM.FACE_LEFT] = { x: 0.2, y: 0.5 };
  pts[LM.FACE_RIGHT] = { x: 0.8, y: 0.5 };
  pts[LM.FOREHEAD] = { x: 0.5, y: 0.12 };
  pts[LM.CHIN] = { x: 0.5, y: 0.9 };
  pts[LM.LEFT_EYE_OUTER] = { x: 0.32 + skew, y: 0.4 + skew };
  pts[LM.LEFT_EYE_INNER] = { x: 0.425 + skew, y: 0.4 };
  pts[LM.RIGHT_EYE_INNER] = { x: 0.575, y: 0.4 };
  pts[LM.RIGHT_EYE_OUTER] = { x: 0.68, y: 0.4 };
  pts[LM.NOSE_TIP] = { x: 0.5, y: 0.55 };
  pts[LM.MOUTH_LEFT] = { x: 0.37 + skew, y: 0.72 };
  pts[LM.MOUTH_RIGHT] = { x: 0.63, y: 0.72 };
  return pts;
}

describe("computeMetrics", () => {
  it("reports near-perfect symmetry for a mirrored face", () => {
    const m = computeMetrics(syntheticFace());
    expect(m.symmetry).toBeGreaterThan(0.95);
  });

  it("reports lower symmetry for a skewed face", () => {
    const sym = computeMetrics(syntheticFace()).symmetry;
    const skewed = computeMetrics(syntheticFace({ skew: 0.06 })).symmetry;
    expect(skewed).toBeLessThan(sym);
  });
});

describe("scoreFromMetrics / scoreFace", () => {
  it("stays within 1–10", () => {
    expect(scoreFace(syntheticFace())).toBeGreaterThanOrEqual(1);
    expect(scoreFace(syntheticFace())).toBeLessThanOrEqual(10);
    expect(
      scoreFromMetrics({
        symmetry: 0,
        eyeSpacing: 0,
        faceRatio: 0,
        mouthNoseBalance: 0,
      }),
    ).toBe(1);
  });

  it("scores a symmetric typical face above a skewed one", () => {
    const good = scoreFace(syntheticFace());
    const skewed = scoreFace(syntheticFace({ skew: 0.08 }));
    expect(good).toBeGreaterThan(skewed);
  });
});
