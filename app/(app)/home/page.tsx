"use client";

import { useCallback, useEffect, useState } from "react";
import { AnonymousPromptCard } from "@/components/feed/AnonymousPromptCard";
import { LikePassButtons } from "@/components/feed/LikePassButtons";
import { Badge } from "@/components/ui/Badge";
import type { AnonymousProfile, DailyMatchPayload } from "@/types/app.types";

type Tab = "today" | "browse";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <main>
      <div className="mb-8 flex gap-6 border-b border-line">
        {(["today", "browse"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm capitalize ${
              tab === t
                ? "border-b border-white text-fg"
                : "text-secondary"
            }`}
          >
            {t === "today" ? "Today" : "Browse"}
          </button>
        ))}
      </div>
      {tab === "today" ? <TodayTab /> : <BrowseTab />}
    </main>
  );
}

function TodayTab() {
  const [data, setData] = useState<DailyMatchPayload | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/feed/daily-match");
    if (res.ok) setData(await res.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(kind: "like" | "pass") {
    if (!data?.match) return;
    setBusy(true);
    await fetch(`/api/feed/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: data.match.profile_id }),
    });
    await load();
    setBusy(false);
  }

  if (!data) return <p className="text-sm text-faint">Loading</p>;

  if (data.state === "none" || !data.match) {
    return (
      <div className="py-16 text-center">
        <p className="text-secondary">Nothing for you yet today.</p>
        <p className="mt-1 text-sm text-faint">
          Someone new appears every morning at 8.
        </p>
      </div>
    );
  }

  if (data.state === "passed") {
    return (
      <div className="py-16 text-center opacity-50">
        <p className="text-secondary">Next person tomorrow.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[11px] uppercase tracking-widest text-faint">
        someone in your area · anonymous
      </p>
      <div className="flex flex-col gap-3">
        {data.match.prompts.map((p) => (
          <AnonymousPromptCard key={p.question_key} prompt={p} />
        ))}
      </div>

      <div className="mt-6">
        {data.state === "mutual" ? (
          <div className="rounded-card border border-good/40 p-4 text-center">
            <Badge tone="good">Mutual</Badge>
            <p className="mt-2 text-sm text-secondary">
              You&apos;ll connect at the next window.
            </p>
          </div>
        ) : data.state === "liked" ? (
          <p className="py-4 text-center text-sm text-secondary">
            You liked this. If they like you back, a call opens at the next
            window.
          </p>
        ) : (
          <LikePassButtons
            onLike={() => act("like")}
            onPass={() => act("pass")}
            disabled={busy}
          />
        )}
      </div>
    </div>
  );
}

function BrowseTab() {
  const [profiles, setProfiles] = useState<AnonymousProfile[] | null>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mutualFlash, setMutualFlash] = useState(false);

  useEffect(() => {
    fetch("/api/feed/queue")
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []));
  }, []);

  async function act(kind: "like" | "pass") {
    const current = profiles?.[index];
    if (!current) return;
    setBusy(true);
    const res = await fetch(`/api/feed/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: current.profile_id }),
    });
    if (kind === "like" && res.ok) {
      const d = await res.json();
      if (d.mutual) {
        setMutualFlash(true);
        setTimeout(() => setMutualFlash(false), 2500);
      }
    }
    setIndex((i) => i + 1);
    setBusy(false);
  }

  if (!profiles) return <p className="text-sm text-faint">Loading</p>;

  const current = profiles[index];
  if (!current) {
    return (
      <div className="py-16 text-center">
        <p className="text-secondary">You&apos;ve seen everyone for today.</p>
        <p className="mt-1 text-sm text-faint">
          Ten a day. That&apos;s the point.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[11px] uppercase tracking-widest text-faint">
        {index + 1} of {profiles.length} · anonymous
      </p>
      <div className="flex flex-col gap-3">
        {current.prompts.map((p) => (
          <AnonymousPromptCard key={p.question_key} prompt={p} />
        ))}
      </div>
      {mutualFlash && (
        <p className="mt-4 text-center text-sm text-good">
          Mutual. You&apos;ll connect at the next window.
        </p>
      )}
      <div className="mt-6">
        <LikePassButtons
          onLike={() => act("like")}
          onPass={() => act("pass")}
          disabled={busy}
        />
      </div>
    </div>
  );
}
