import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { scorePhoto } from "@/lib/replicate";
import { assignTier, bracketScoreFromPhotos } from "@/lib/brackets";

export const maxDuration = 120;

// Client uploads photos to its own storage folder, then posts the paths
// here. This route scores them (Replicate), stores per-photo scores,
// computes bracket_score / bracket_tier, and marks the best photo.
// No score or tier ever appears in the response.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const paths: string[] = body?.storage_paths;
  if (!Array.isArray(paths) || paths.length < 2 || paths.length > 6) {
    return NextResponse.json(
      { error: "Upload between 2 and 6 photos" },
      { status: 400 },
    );
  }
  if (paths.some((p) => typeof p !== "string" || !p.startsWith(`${user.id}/`))) {
    return NextResponse.json({ error: "Invalid photo path" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // Clear any previous onboarding attempt
  await admin.from("photos").delete().eq("user_id", user.id);

  const scored: { path: string; score: number }[] = [];
  for (const path of paths) {
    const { data: signed } = await admin.storage
      .from("photos")
      .createSignedUrl(path, 600);
    if (!signed?.signedUrl) {
      return NextResponse.json(
        { error: "Photo not found in storage" },
        { status: 400 },
      );
    }
    try {
      const score = await scorePhoto(signed.signedUrl);
      scored.push({ path, score });
    } catch {
      return NextResponse.json(
        { error: "We couldn't process one of your photos. Try a different one." },
        { status: 422 },
      );
    }
  }

  const bestPath = scored.reduce((a, b) => (b.score > a.score ? b : a)).path;

  const { error: insertError } = await admin.from("photos").insert(
    scored.map(({ path, score }) => ({
      user_id: user.id,
      storage_path: path,
      ai_score: score,
      is_best: path === bestPath,
    })),
  );
  if (insertError) {
    return NextResponse.json({ error: "Could not save photos" }, { status: 500 });
  }

  const bracketScore = bracketScoreFromPhotos(scored.map((s) => s.score));
  await admin
    .from("users")
    .update({
      bracket_score: bracketScore,
      bracket_tier: assignTier(bracketScore),
    })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
