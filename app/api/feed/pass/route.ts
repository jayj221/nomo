import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const profileId: string = body?.profile_id;
  if (!profileId || profileId === user.id) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  const { error } = await supabase
    .from("passes")
    .upsert(
      { from_user: user.id, to_user: profileId },
      { onConflict: "from_user,to_user" },
    );
  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
