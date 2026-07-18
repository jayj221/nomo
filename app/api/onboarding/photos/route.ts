import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { assignTier, bracketScoreFromPhotos } from "@/lib/brackets";

export const maxDuration = 60;

// Client uploads photos to its own storage folder, runs facial-geometry
// scoring locally (MediaPipe landmarks → symmetry/proportion metrics),
// and posts paths + per-photo scores here. The server clamps and stores
// them, computes the bracket, and — exactly once — returns the placement
// to its owner. After that the score is never exposed again, to anyone.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const photos: { path: string; score: number }[] = body?.photos;
  if (!Array.isArray(photos) || photos.length < 2 || photos.length > 6) {
    return NextResponse.json(
      { error: "Upload between 2 and 6 photos" },
      { status: 400 },
    );
  }
  for (const p of photos) {
    if (
      typeof p?.path !== "string" ||
      !p.path.startsWith(`${user.id}/`) ||
      typeof p?.score !== "number" ||
      Number.isNaN(p.score)
    ) {
      return NextResponse.json({ error: "Invalid photo data" }, { status: 400 });
    }
  }

  const admin = createAdminSupabase();

  // Verify every path actually exists in the caller's own folder
  for (const p of photos) {
    const { data: signed } = await admin.storage
      .from("photos")
      .createSignedUrl(p.path, 60);
    if (!signed?.signedUrl) {
      return NextResponse.json(
        { error: "Photo not found in storage" },
        { status: 400 },
      );
    }
  }

  const scored = photos.map((p) => ({
    path: p.path,
    score: Math.max(1, Math.min(10, p.score)),
  }));
  const bestPath = scored.reduce((a, b) => (b.score > a.score ? b : a)).path;

  await admin.from("photos").delete().eq("user_id", user.id);
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
  const tier = assignTier(bracketScore);

  const { data: me } = await admin
    .from("users")
    .select("score_viewed")
    .eq("id", user.id)
    .single();

  await admin
    .from("users")
    .update({
      bracket_score: bracketScore,
      bracket_tier: tier,
      score_viewed: true,
    })
    .eq("id", user.id);

  // The one and only time the placement leaves the server.
  if (!me?.score_viewed) {
    return NextResponse.json({ ok: true, placement: { tier } });
  }
  return NextResponse.json({ ok: true });
}
