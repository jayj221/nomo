import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { todayDate } from "@/lib/feed";

// Active window + who you can talk to right now, ordered by today's
// lineup rank (rank 1 = closest vibe = start there). Still anonymous.
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

  // Mutual marks involving me
  const [{ data: sent }, { data: received }, { data: lineup }] =
    await Promise.all([
      admin.from("likes").select("to_user").eq("from_user", user.id),
      admin.from("likes").select("from_user").eq("to_user", user.id),
      admin
        .from("daily_match")
        .select("matched_user_id, rank")
        .eq("user_id", user.id)
        .eq("date", todayDate()),
    ]);
  const sentSet = new Set((sent ?? []).map((r) => r.to_user));
  const mutuals = (received ?? [])
    .map((r) => r.from_user)
    .filter((id) => sentSet.has(id));

  const rankOf = new Map(
    (lineup ?? []).map((l) => [l.matched_user_id, l.rank]),
  );

  const available: {
    connection_user_id: string;
    rank: number | null;
    label: string;
  }[] = [];
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
        rank: rankOf.get(otherId) ?? null,
        label: "",
      });
    }
  }

  // Rank order: today's lineup first (1..10), older mutuals after
  available.sort((x, y) => (x.rank ?? 99) - (y.rank ?? 99));
  available.forEach((c, i) => {
    c.label = c.rank ? `#${c.rank} · today's ten` : `Person ${i + 1}`;
  });

  await admin
    .from("users")
    .update({ last_active: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ window, connections: available });
}
