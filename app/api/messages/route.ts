import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const connectionId: string = body?.connection_id;
  const content: string = body?.content;
  if (!connectionId || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Too long" }, { status: 400 });
  }

  // RLS enforces: sender is a participant AND chat is enabled
  const { data, error } = await supabase
    .from("messages")
    .insert({
      connection_id: connectionId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select("id, connection_id, sender_id, content, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not send" }, { status: 403 });
  }
  return NextResponse.json({ message: data });
}
