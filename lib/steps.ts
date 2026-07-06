// Unlock step model — encoded in one place.
//
// connections.unlock_step: 1=prompts, 2=voice, 3=photo, 4=name+profile, 5=chat+socials
// calls.unlock_step:       1=voice only, 2=photo, 3=name+profile, 4=chat
//
// A call step maps to connection step +1 (a call already implies voice).

export const CONNECTION_STEP = {
  PROMPTS: 1,
  VOICE: 2,
  PHOTO: 3,
  NAME_PROFILE: 4,
  CHAT_SOCIALS: 5,
} as const;

export const CALL_STEP = {
  VOICE_ONLY: 1,
  PHOTO: 2,
  NAME_PROFILE: 3,
  CHAT: 4,
} as const;

export const MAX_CALL_STEP = 4;

export function callStepToConnectionStep(callStep: number): number {
  return Math.min(callStep + 1, CONNECTION_STEP.CHAT_SOCIALS);
}

// Call timing (seconds)
export const INITIAL_CALL_SECONDS = 120; // default window is 2 minutes
export const EXTENSION_SECONDS = 120; // each mutual extension adds 2 minutes
export const EXTEND_PROMPT_AT_REMAINING = 60; // "Extend?" shows at 1:00 left
export const PHOTO_UNLOCK_AT = 180; // 3:00 total → photo reveal prompt
export const NAME_UNLOCK_AT = 360; // 6:00 total → names prompt
export const FAST_SKIP_SECONDS = 5; // skip under 5s → behavioral penalty
