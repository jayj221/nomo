import { describe, expect, it } from "vitest";
import { mutuallyCompatible } from "@/lib/feed";

describe("mutuallyCompatible", () => {
  const man = { gender: "man", seeking: ["woman"] };
  const woman = { gender: "woman", seeking: ["man"] };
  const womanSeekingWomen = { gender: "woman", seeking: ["woman"] };
  const everyone = {
    gender: "nonbinary",
    seeking: ["man", "woman", "nonbinary"],
  };

  it("requires both directions to want each other", () => {
    expect(mutuallyCompatible(man, woman)).toBe(true);
    expect(mutuallyCompatible(woman, man)).toBe(true);
    expect(mutuallyCompatible(man, womanSeekingWomen)).toBe(false);
    // seeking women only ≠ compatible with a nonbinary person
    expect(mutuallyCompatible(womanSeekingWomen, everyone)).toBe(false);
    expect(
      mutuallyCompatible(womanSeekingWomen, {
        gender: "woman",
        seeking: ["woman"],
      }),
    ).toBe(true);
    expect(mutuallyCompatible(man, everyone)).toBe(false); // man seeks women only
  });

  it("rejects incomplete profiles", () => {
    expect(mutuallyCompatible({ gender: null, seeking: ["man"] }, woman)).toBe(
      false,
    );
    expect(mutuallyCompatible({ gender: "man", seeking: null }, woman)).toBe(
      false,
    );
  });
});
