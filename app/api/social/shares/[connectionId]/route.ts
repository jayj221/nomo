import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";

// You see what they shared, they see what you shared — per platform,
// only after you both chose to share that platform.
export async function GET(
  _request: Request,
  { params }: { params: { connectionId: string } },
) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  // RLS already restricts to participants of the connection
  const { data: shares, error } = await supabase
    .from("social_shares")
    .select("user_id, platform, handle")
    .eq("connection_id", params.connectionId);

  if (error) {
    return NextResponse.json({ error: "Could not load" }, { status: 403 });
  }

  const mine = (shares ?? []).filter((s) => s.user_id === user.id);
  const minePlatforms = new Set(mine.map((s) => s.platform));
  // Their handle for a platform is visible only if you shared that platform too
  const theirs = (shares ?? []).filter(
    (s) => s.user_id !== user.id && minePlatforms.has(s.platform),
  );

  return NextResponse.json({
    mine: mine.map(({ platform, handle }) => ({ platform, handle })),
    theirs: theirs.map(({ platform, handle }) => ({ platform, handle })),
  });
}
