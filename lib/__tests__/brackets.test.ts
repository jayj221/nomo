import { describe, expect, it } from "vitest";
import {
  assignTier,
  bracketScoreFromPhotos,
  clampScore,
} from "@/lib/brackets";

describe("assignTier", () => {
  it("rounds scores to integer brackets 1–10", () => {
    expect(assignTier(0)).toBe(1); // floor at 1
    expect(assignTier(1.4)).toBe(1);
    expect(assignTier(5.5)).toBe(6);
    expect(assignTier(7.49)).toBe(7);
    expect(assignTier(9.6)).toBe(10);
    expect(assignTier(12)).toBe(10); // ceiling at 10
  });
});

describe("bracketScoreFromPhotos", () => {
  it("averages the top 3 scores", () => {
    expect(bracketScoreFromPhotos([2, 8, 6, 4])).toBe(6); // (8+6+4)/3
  });

  it("works with fewer than 3 photos", () => {
    expect(bracketScoreFromPhotos([4, 6])).toBe(5);
  });

  it("rounds to two decimals", () => {
    expect(bracketScoreFromPhotos([5, 5, 6])).toBe(5.33);
  });
});

describe("clampScore", () => {
  it("clamps into the 0–10 range", () => {
    expect(clampScore(-1)).toBe(0);
    expect(clampScore(11)).toBe(10);
    expect(clampScore(5.123)).toBe(5.12);
  });
});
