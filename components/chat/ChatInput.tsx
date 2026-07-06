"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  onSend: (content: string) => Promise<void>;
}

export function ChatInput({ onSend }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content || busy) return;
    setBusy(true);
    await onSend(content);
    setValue("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Say something"
        maxLength={2000}
        className="flex-1 px-4 py-3 text-sm"
      />
      <Button full={false} type="submit" disabled={busy || !value.trim()} className="px-5">
        Send
      </Button>
    </form>
  );
}
