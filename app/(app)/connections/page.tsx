"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StepStrip } from "@/components/call/StepStrip";
import { Badge } from "@/components/ui/Badge";
import type { ConnectionSummary } from "@/types/app.types";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionSummary[] | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((d) => setConnections(d.connections ?? []));
  }, []);

  if (!connections) return <p className="text-sm text-faint">Loading</p>;

  if (connections.length === 0) {
    return (
      <main className="py-16 text-center">
        <p className="text-secondary">No connections yet.</p>
        <p className="mt-1 text-sm text-faint">
          Calls that go well end up here.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="mb-6 text-xl font-semibold">Connections</h1>
      <div className="flex flex-col gap-2">
        {connections.map((c) => {
          const inner = (
            <div className="flex items-center gap-3 rounded-card border border-line bg-card p-3">
              <Avatar src={c.other.photo_url} size={44} />
              <div className="flex-1">
                <p className="text-sm text-fg">
                  {c.other.first_name ?? "Anonymous"}
                  {c.other.age ? `, ${c.other.age}` : ""}
                </p>
                <div className="mt-1 w-fit">
                  <StepStrip step={c.unlock_step} />
                </div>
              </div>
              {c.chat_enabled ? (
                <Badge tone="good">chat open</Badge>
              ) : (
                <Badge>next window</Badge>
              )}
            </div>
          );
          return c.chat_enabled ? (
            <Link key={c.id} href={`/connections/${c.id}`}>
              {inner}
            </Link>
          ) : (
            <div key={c.id}>{inner}</div>
          );
        })}
      </div>
    </main>
  );
}
