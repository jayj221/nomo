import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildRevealPayload } from "@/lib/reveal";
import type { ConnectionSummary } from "@/types/app.types";

export async function GET() {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const { data: rows } = await supabase
    .from("connections")
    .select("id, user_a, user_b, unlock_step, chat_enabled, created_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const admin = createAdminSupabase();
  const connections: ConnectionSummary[] = [];
  for (const row of rows ?? []) {
    const otherId = row.user_a === user.id ? row.user_b : row.user_a;
    connections.push({
      id: row.id,
      unlock_step: row.unlock_step,
      chat_enabled: row.chat_enabled,
      created_at: row.created_at,
      other: await buildRevealPayload(admin, otherId, row.unlock_step),
    });
  }

  return NextResponse.json({ connections });
}
