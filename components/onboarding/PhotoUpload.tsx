"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

interface Slot {
  file: File;
  preview: string;
}

type Phase = "picking" | "checking" | "uploading" | "scoring";

// Face presence check only — confirms a face exists in the photo.
// Deliberately NOT facial recognition; nothing is compared to anyone.
async function hasFace(file: File): Promise<boolean> {
  try {
    const { default: Human } = await import("@vladmandic/human");
    const human = new Human({
      modelBasePath: "https://cdn.jsdelivr.net/npm/@vladmandic/human/models/",
      face: { enabled: true, detector: { maxDetected: 1 } },
      body: { enabled: false },
      hand: { enabled: false },
      gesture: { enabled: false },
    });
    const bitmap = await createImageBitmap(file);
    const result = await human.detect(bitmap);
    bitmap.close();
    return result.face.length > 0;
  } catch {
    // If the model fails to load, don't block the user — the server
    // pipeline is the authority on photo validity.
    return true;
  }
}

export function PhotoUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [phase, setPhase] = useState<Phase>("picking");
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    setPhase("checking");
    const next = [...slots];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/")) continue;
      if (!(await hasFace(file))) {
        setError("We need photos with your face in them.");
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setSlots(next);
    setPhase("picking");
  }

  function removeSlot(i: number) {
    URL.revokeObjectURL(slots[i].preview);
    setSlots(slots.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setError(null);
    setPhase("uploading");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const paths: string[] = [];
    for (const slot of slots) {
      const ext = slot.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, slot.file, { contentType: slot.file.type });
      if (upErr) {
        setError("Upload failed. Check your connection and try again.");
        setPhase("picking");
        return;
      }
      paths.push(path);
    }

    setPhase("scoring");
    const res = await fetch("/api/onboarding/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storage_paths: paths }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Try again.");
      setPhase("picking");
      return;
    }
    router.push("/prompts");
  }

  const busy = phase !== "picking";

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-xl font-semibold">Your photos</h1>
      <p className="mt-1 text-sm text-secondary">
        {MIN_PHOTOS}–{MAX_PHOTOS} photos. Nobody sees them until you both
        choose to reveal.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_PHOTOS }).map((_, i) =>
          slots[i] ? (
            <button
              key={i}
              onClick={() => removeSlot(i)}
              className="relative aspect-square overflow-hidden rounded-card border border-line"
              disabled={busy}
            >
              <img
                src={slots[i].preview}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-fg">
                ✕
              </span>
            </button>
          ) : (
            <button
              key={i}
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex aspect-square items-center justify-center rounded-card border border-dashed border-line text-2xl text-faint"
            >
              +
            </button>
          ),
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}

      <div className="mt-auto pt-8">
        <Button
          onClick={submit}
          disabled={slots.length < MIN_PHOTOS || busy}
        >
          {phase === "checking" && "Checking photos"}
          {phase === "uploading" && "Uploading"}
          {phase === "scoring" && "Processing — this takes a moment"}
          {phase === "picking" && "Continue"}
        </Button>
      </div>
    </div>
  );
}
