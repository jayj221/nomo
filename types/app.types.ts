export type Gender = "man" | "woman" | "nonbinary";

export interface AnonymousPrompt {
  question_key: string;
  question: string;
  answer: string;
}

/** A profile as the client is allowed to see it pre-reveal: prompts only. */
export interface AnonymousProfile {
  profile_id: string; // opaque — the target user id, used for like/pass
  prompts: AnonymousPrompt[];
  liked: boolean;
  mutual: boolean;
}

export interface DailyMatchPayload {
  match: AnonymousProfile | null;
  state: "fresh" | "liked" | "mutual" | "passed" | "none";
}

export interface ActiveWindow {
  id: string;
  fired_at: string;
  expires_at: string;
}

export interface AvailableConnection {
  connection_user_id: string;
  label: string; // "Person 1", "Person 2" — anonymous
}

export type UnlockStep = 1 | 2 | 3 | 4 | 5;

export interface CallState {
  id: string;
  room_url: string;
  token: string;
  unlock_step: UnlockStep;
}

export interface RevealPayload {
  photo_url?: string; // signed URL, 15-min expiry — only after step 3
  first_name?: string; // only after step 4
  age?: number;
  city?: string;
}

export interface ConnectionSummary {
  id: string;
  unlock_step: UnlockStep;
  chat_enabled: boolean;
  created_at: string;
  other: RevealPayload; // populated according to unlock_step
}

export interface ChatMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export type SocialPlatform = "instagram" | "tiktok" | "spotify" | "apple_music";

export interface SocialShare {
  platform: SocialPlatform;
  handle: string;
  user_id: string;
}
