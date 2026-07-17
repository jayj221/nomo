"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setMessage(null);

    const referrer =
      typeof document !== "undefined" ? document.referrer || null : null;

    const { error } = await createClient()
      .from("waitlist")
      .insert({ email: email.trim().toLowerCase(), referrer });

    if (error) {
      // 23505 = unique violation → they're already on the list
      if (error.code === "23505") {
        setStatus("done");
        setMessage("You're already on the list. We'll be in touch.");
        return;
      }
      setStatus("error");
      setMessage("Something went wrong. Try again in a moment.");
      return;
    }

    setStatus("done");
    setMessage("You're in. We'll reach out when your window opens.");
  }

  if (status === "done") {
    return (
      <div className="rounded-card border border-good/40 bg-card p-5 text-center">
        <p className="text-good">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-3 text-sm"
      />
      <Button type="submit" disabled={status === "busy"}>
        {status === "busy" ? "One moment" : "Request an invite"}
      </Button>
      {status === "error" && message && (
        <p className="text-sm text-bad">{message}</p>
      )}
      <p className="text-center text-xs text-faint">
        No spam. Just one message when your window opens.
      </p>
    </form>
  );
}
