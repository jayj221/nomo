import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: { connectionId: string } },
) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { supabase } = auth;

  // RLS restricts reads to participants of the connection
  const { data, error } = await supabase
    .from("messages")
    .select("id, connection_id, sender_id, content, created_at")
    .eq("connection_id", params.connectionId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: "Could not load" }, { status: 403 });
  }
  return NextResponse.json({ messages: data ?? [] });
}
