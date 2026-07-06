"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WindowCountdown } from "@/components/window/WindowCountdown";
import { ConnectionSlot } from "@/components/window/ConnectionSlot";
import type { ActiveWindow, AvailableConnection } from "@/types/app.types";

export default function WindowPage() {
  const router = useRouter();
  const [window, setWindow] = useState<ActiveWindow | null>(null);
  const [connections, setConnections] = useState<AvailableConnection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/window/active");
    if (res.ok) {
      const d = await res.json();
      setWindow(d.window);
      setConnections(d.connections ?? []);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Incoming call: the other person tapped Join first
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`user:${user.id}`)
        .on("broadcast", { event: "incoming-call" }, ({ payload }) => {
          if (payload?.call_id) router.push(`/call/${payload.call_id}`);
        })
        .subscribe();
    });
    return () => {
      if (channel) createClient().removeChannel(channel);
    };
  }, [router]);

  async function join(other: AvailableConnection) {
    if (!window) return;
    setJoining(true);
    setError(null);
    const res = await fetch("/api/call/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        other_user_id: other.connection_user_id,
        window_id: window.id,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "Couldn't start the call.");
      setJoining(false);
      return;
    }
    const d = await res.json();
    sessionStorage.setItem(
      `call:${d.call_id}`,
      JSON.stringify({ room_url: d.room_url, token: d.token }),
    );
    router.push(`/call/${d.call_id}`);
  }

  if (!loaded) return <p className="text-sm text-faint">Loading</p>;

  if (!window) {
    return (
      <main className="flex flex-col items-center py-24 text-center">
        <p className="text-secondary">No window open right now.</p>
        <p className="mt-2 max-w-xs text-sm text-faint">
          Windows open a few times a day, for everyone at once. Fifteen
          minutes. Then they close.
        </p>
      </main>
    );
  }

  return (
    <main>
      <p className="mb-2 text-center text-[11px] uppercase tracking-widest text-good">
        window open
      </p>
      <WindowCountdown expiresAt={window.expires_at} onExpired={load} />

      <p className="mb-4 mt-10 text-sm text-secondary">
        Your mutual connections available now: {connections.length}
      </p>

      <div className="flex flex-col gap-2">
        {connections.map((c) => (
          <ConnectionSlot
            key={c.connection_user_id}
            connection={c}
            onJoin={() => join(c)}
            busy={joining}
          />
        ))}
        {connections.length === 0 && (
          <p className="py-8 text-center text-sm text-faint">
            No one available yet. Mutual likes appear here when a window
            opens.
          </p>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}
    </main>
  );
}
