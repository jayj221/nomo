"use client";

import { Button } from "@/components/ui/Button";

interface Props {
  title: string;
  yesLabel: string;
  noLabel: string;
  waiting: boolean; // you said yes, the other person hasn't yet
  onYes: () => void;
  onNo: () => void;
}

export function UnlockPrompt({
  title,
  yesLabel,
  noLabel,
  waiting,
  onYes,
  onNo,
}: Props) {
  return (
    <div className="rounded-card border border-line bg-card p-5">
      <p className="text-center text-base text-fg">{title}</p>
      {waiting ? (
        <p className="mt-4 text-center text-sm text-secondary">
          Waiting for them.
        </p>
      ) : (
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={onNo}>
            {noLabel}
          </Button>
          <Button onClick={onYes}>{yesLabel}</Button>
        </div>
      )}
    </div>
  );
}
