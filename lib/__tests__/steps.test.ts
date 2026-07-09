import { describe, expect, it } from "vitest";
import {
  callStepToConnectionStep,
  CALL_STEP,
  CONNECTION_STEP,
} from "@/lib/steps";

describe("callStepToConnectionStep", () => {
  it("maps call steps to connection steps (+1, a call implies voice)", () => {
    expect(callStepToConnectionStep(CALL_STEP.VOICE_ONLY)).toBe(
      CONNECTION_STEP.VOICE,
    );
    expect(callStepToConnectionStep(CALL_STEP.PHOTO)).toBe(
      CONNECTION_STEP.PHOTO,
    );
    expect(callStepToConnectionStep(CALL_STEP.NAME_PROFILE)).toBe(
      CONNECTION_STEP.NAME_PROFILE,
    );
    expect(callStepToConnectionStep(CALL_STEP.CHAT)).toBe(
      CONNECTION_STEP.CHAT_SOCIALS,
    );
  });

  it("never exceeds the chat+socials step", () => {
    expect(callStepToConnectionStep(99)).toBe(CONNECTION_STEP.CHAT_SOCIALS);
  });
});
