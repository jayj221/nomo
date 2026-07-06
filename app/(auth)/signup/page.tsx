"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(
        error.message.includes("already")
          ? "That email is taken. Sign in instead."
          : "Couldn't create your account. Try a stronger password.",
      );
      setBusy(false);
      return;
    }
    router.push("/photos");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Window</h1>
      <p className="mt-1 text-sm text-secondary">
        Anonymous first. Voice before faces. Nothing reveals unless you both
        choose it.
      </p>

      <form onSubmit={submit} className="mt-10 flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-3 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-bad">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? "One moment" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-fg underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </main>
  );
}
