"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VIBE_TAGS, MIN_TAGS, MAX_TAGS } from "@/lib/tags";

const SEEKING_OPTIONS = [
  { label: "Men", value: ["man"] },
  { label: "Women", value: ["woman"] },
  { label: "Everyone", value: ["man", "woman", "nonbinary"] },
];

export default function ProfilePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [seeking, setSeeking] = useState<string[] | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < MAX_TAGS
          ? [...prev, tag]
          : prev,
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/onboarding/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        age: parseInt(age, 10),
        city,
        gender,
        seeking,
        vibe_tags: tags,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    router.push("/liveness");
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <h1 className="text-xl font-semibold">About you</h1>
      <p className="mt-1 text-sm text-secondary">
        Your name stays hidden until you both choose to share it.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <input
          required
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="px-4 py-3 text-sm"
        />
        <input
          required
          type="number"
          min={18}
          max={100}
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="px-4 py-3 text-sm"
        />
        <input
          required
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-4 py-3 text-sm"
        />

        <p className="mt-3 text-xs uppercase tracking-widest text-faint">
          I am
        </p>
        <div className="flex gap-2">
          {["man", "woman", "nonbinary"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 rounded-btn border px-3 py-2.5 text-sm capitalize ${
                gender === g
                  ? "border-white/60 text-fg"
                  : "border-line text-secondary"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs uppercase tracking-widest text-faint">
          I want to connect with
        </p>
        <div className="flex gap-2">
          {SEEKING_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSeeking(opt.value)}
              className={`flex-1 rounded-btn border px-3 py-2.5 text-sm ${
                seeking?.join() === opt.value.join()
                  ? "border-white/60 text-fg"
                  : "border-line text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs uppercase tracking-widest text-faint">
          Your vibe · pick {MIN_TAGS}–{MAX_TAGS} ({tags.length} picked)
        </p>
        <div className="flex flex-wrap gap-2">
          {VIBE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-btn border px-3 py-1.5 text-sm ${
                tags.includes(tag)
                  ? "border-white/60 text-fg"
                  : "border-line text-secondary"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <p className="text-xs text-faint">
          Your daily ten is ranked by how much of this you share.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}

      <div className="mt-auto pt-8">
        <Button
          type="submit"
          disabled={busy || !gender || !seeking || tags.length < MIN_TAGS}
        >
          {busy ? "Saving" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
