import type { SupabaseClient } from "@supabase/supabase-js";
import type { RevealPayload } from "@/types/app.types";
import { CONNECTION_STEP } from "@/lib/steps";

const SIGNED_URL_SECONDS = 15 * 60; // 15-minute expiry, per product rule 6

/**
 * Build what the viewer is allowed to see about another user, strictly
 * gated by the connection's unlock step. Called with the admin client;
 * never include scoring columns in the result.
 */
export async function buildRevealPayload(
  admin: SupabaseClient,
  otherUserId: string,
  unlockStep: number,
): Promise<RevealPayload> {
  const payload: RevealPayload = {};

  if (unlockStep >= CONNECTION_STEP.PHOTO) {
    const { data: photo } = await admin
      .from("photos")
      .select("storage_path")
      .eq("user_id", otherUserId)
      .eq("is_best", true)
      .maybeSingle();
    if (photo?.storage_path) {
      const { data: signed } = await admin.storage
        .from("photos")
        .createSignedUrl(photo.storage_path, SIGNED_URL_SECONDS);
      if (signed?.signedUrl) payload.photo_url = signed.signedUrl;
    }
  }

  if (unlockStep >= CONNECTION_STEP.NAME_PROFILE) {
    const { data: u } = await admin
      .from("users")
      .select("first_name, age, city")
      .eq("id", otherUserId)
      .single();
    if (u) {
      payload.first_name = u.first_name ?? undefined;
      payload.age = u.age ?? undefined;
      payload.city = u.city ?? undefined;
    }
  }

  return payload;
}

/** Canonical ordered pair for the connections unique constraint. */
export function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
