"use client";

import { useCallback, useEffect, useState } from "react";
import { AnonymousPromptCard } from "@/components/feed/AnonymousPromptCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { AnonymousPrompt } from "@/types/app.types";

interface LineupProfile {
  profile_id: string;
  rank: number;
  prompts: AnonymousPrompt[];
  vibe_tags: string[];
  liked: boolean;
  mutual: boolean;
}

// Today's ten: read them all, mark who you'd talk to. When the window
// opens, mutual interest becomes a call — most-compatible first.
export default function HomePage() {
  const [profiles, setProfiles] = useState<LineupProfile[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/feed/lineup");
    if (res.ok) {
      const d = await res.json();
      setProfiles(d.profiles ?? []);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function like(profileId: string) {
    setBusy(true);
    await fetch("/api/feed/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId }),
    });
    await load();
    setBusy(false);
  }

  if (!profiles) return <p className="text-sm text-faint">Loading</p>;

  if (profiles.length === 0) {
    return (
      <main className="py-16 text-center">
        <p className="text-secondary">Your ten aren&apos;t ready yet.</p>
        <p className="mt-1 text-sm text-faint">
          A fresh lineup lands every morning. Check back soon.
        </p>
      </main>
    );
  }

  return (
    <main>
      <p className="text-[11px] uppercase tracking-widest text-faint">
        Today&apos;s ten · ranked by shared vibe · anonymous
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {profiles.map((p) => {
          const expanded = open === p.profile_id;
          return (
            <div
              key={p.profile_id}
              className="rounded-card border border-line bg-card"
            >
              <button
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => setOpen(expanded ? null : p.profile_id)}
              >
                <span className="text-sm tabular-nums text-faint">
                  #{p.rank}
                </span>
                <span className="answer-text flex-1 truncate text-fg">
                  {p.prompts[0]?.answer}
                </span>
                {p.mutual ? (
                  <Badge tone="good">mutual</Badge>
                ) : p.liked ? (
                  <Badge>marked</Badge>
                ) : null}
              </button>

              {expanded && (
                <div className="flex flex-col gap-3 border-t border-line p-4">
                  {p.prompts.map((pr) => (
                    <AnonymousPromptCard key={pr.question_key} prompt={pr} />
                  ))}
                  {p.vibe_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.vibe_tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-btn border border-line px-2 py-0.5 text-xs text-secondary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.mutual ? (
                    <p className="py-2 text-center text-sm text-good">
                      Mutual. You&apos;ll connect at the next window.
                    </p>
                  ) : p.liked ? (
                    <p className="py-2 text-center text-sm text-secondary">
                      Marked. If they mark you back, the next window is
                      yours.
                    </p>
                  ) : (
                    <Button onClick={() => like(p.profile_id)} disabled={busy}>
                      I&apos;d talk to them
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-faint">
        Ten a day. One window. Two reveals. That&apos;s the whole game.
      </p>
    </main>
  );
}
