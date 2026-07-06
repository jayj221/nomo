"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, MAX_ANSWER_LENGTH } from "@/lib/questions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Draft {
  question_key: string;
  answer: string;
}

export function PromptPicker() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  function toggle(key: string) {
    setError(null);
    const existing = drafts.find((d) => d.question_key === key);
    if (existing) {
      setDrafts(drafts.filter((d) => d.question_key !== key));
    } else if (drafts.length < 3) {
      setDrafts([...drafts, { question_key: key, answer: "" }]);
    }
  }

  function setAnswer(key: string, answer: string) {
    setDrafts(
      drafts.map((d) => (d.question_key === key ? { ...d, answer } : d)),
    );
    setFlagged([]);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setFlagged([]);
    const res = await fetch("/api/onboarding/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompts: drafts.map((d, i) => ({ ...d, position: i + 1 })),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Try again.");
      if (data?.flagged_positions) setFlagged(data.flagged_positions);
      setBusy(false);
      return;
    }
    router.push("/profile");
  }

  const ready =
    drafts.length === 3 && drafts.every((d) => d.answer.trim().length > 0);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-xl font-semibold">Three prompts</h1>
      <p className="mt-1 text-sm text-secondary">
        This is all anyone sees at first. Make it worth a call.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {QUESTIONS.map((q) => {
          const draft = drafts.find((d) => d.question_key === q.key);
          const idx = drafts.findIndex((d) => d.question_key === q.key);
          const isFlagged = draft && flagged.includes(idx + 1);
          return (
            <Card
              key={q.key}
              className={draft ? "border-white/25" : "cursor-pointer"}
              onClick={() => !draft && toggle(q.key)}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-widest text-faint">
                  {q.text}
                </p>
                {draft && (
                  <button
                    onClick={() => toggle(q.key)}
                    className="text-xs text-secondary"
                  >
                    remove
                  </button>
                )}
              </div>
              {draft && (
                <div className="mt-3">
                  <textarea
                    value={draft.answer}
                    maxLength={MAX_ANSWER_LENGTH}
                    rows={3}
                    autoFocus
                    onChange={(e) => setAnswer(q.key, e.target.value)}
                    placeholder="Say it like you'd say it out loud"
                    className="answer-text w-full resize-none px-3 py-2 text-base"
                  />
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-bad">
                      {isFlagged && "That answer won't work here. Try again."}
                    </span>
                    <span className="text-faint">
                      {draft.answer.length}/{MAX_ANSWER_LENGTH}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {error && flagged.length === 0 && (
        <p className="mt-4 text-sm text-bad">{error}</p>
      )}

      <div className="sticky bottom-0 mt-8 bg-bg py-4">
        <Button onClick={submit} disabled={!ready || busy}>
          {busy ? "Checking" : `Continue (${drafts.length}/3 picked)`}
        </Button>
      </div>
    </div>
  );
}
