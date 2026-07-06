import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { AvailableConnection } from "@/types/app.types";

export async function GET() {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user } = auth;

  const admin = createAdminSupabase();

  const { data: window } = await admin
    .from("windows")
    .select("id, fired_at, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("fired_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!window) {
    return NextResponse.json({ window: null, connections: [] });
  }

  // Mutual likes involving me, still anonymous, no chat-level connection yet
  const [{ data: sent }, { data: received }] = await Promise.all([
    admin.from("likes").select("to_user").eq("from_user", user.id),
    admin.from("likes").select("from_user").eq("to_user", user.id),
  ]);
  const sentSet = new Set((sent ?? []).map((r) => r.to_user));
  const mutuals = (received ?? [])
    .map((r) => r.from_user)
    .filter((id) => sentSet.has(id));

  const available: AvailableConnection[] = [];
  for (const otherId of mutuals) {
    const [a, b] = user.id < otherId ? [user.id, otherId] : [otherId, user.id];
    const { data: conn } = await admin
      .from("connections")
      .select("chat_enabled")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    if (!conn?.chat_enabled) {
      available.push({
        connection_user_id: otherId,
        label: `Person ${available.length + 1}`,
      });
    }
  }

  await admin
    .from("users")
    .update({ last_active: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ window, connections: available });
}
