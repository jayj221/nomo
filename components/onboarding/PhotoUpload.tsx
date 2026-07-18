"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { scoreFace, type Point } from "@/lib/facescore";

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

interface Slot {
  file: File;
  preview: string;
  score: number;
}

type Phase = "picking" | "checking" | "uploading" | "placement";

// Landmark model is loaded once and reused across photos.
let landmarkerPromise: Promise<
  import("@mediapipe/tasks-vision").FaceLandmarker
> | null = null;

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );
      return vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

// Face presence + geometry scoring, entirely on-device. The photo's
// landmarks never leave the browser — only the resulting number does.
async function analyzePhoto(
  file: File,
): Promise<{ face: boolean; score: number }> {
  try {
    const landmarker = await getLandmarker();
    const bitmap = await createImageBitmap(file);
    const result = landmarker.detect(bitmap);
    bitmap.close();
    const pts = result.faceLandmarks?.[0] as Point[] | undefined;
    if (!pts || pts.length < 400) return { face: false, score: 0 };
    return { face: true, score: scoreFace(pts) };
  } catch {
    // Model failed to load — don't block the user; neutral placement.
    return { face: true, score: 5 };
  }
}

export function PhotoUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [phase, setPhase] = useState<Phase>("picking");
  const [tier, setTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    setPhase("checking");
    const next = [...slots];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/")) continue;
      const { face, score } = await analyzePhoto(file);
      if (!face) {
        setError("We need photos with your face clearly visible.");
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file), score });
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

    const payload: { path: string; score: number }[] = [];
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
      payload.push({ path, score: slot.score });
    }

    const res = await fetch("/api/onboarding/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Try again.");
      setPhase("picking");
      return;
    }
    const data = await res.json();
    if (data.placement?.tier) {
      setTier(data.placement.tier);
      setPhase("placement");
    } else {
      router.push("/prompts");
    }
  }

  // ── The one-time placement screen ────────────────────────────────
  if (phase === "placement" && tier !== null) {
    return (
      <div className="flex flex-1 flex-col">
        <p className="text-[11px] uppercase tracking-widest text-faint">
          Your placement — shown once, only to you
        </p>
        <div className="mt-8 flex flex-col items-center rounded-card border border-line bg-card p-10 text-center">
          <p className="text-6xl font-light tabular-nums">{tier}</p>
          <p className="mt-2 text-sm text-secondary">of 10 brackets</p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-secondary">
            Everyone in your daily ten is in this same bracket. Nobody —
            including them — ever sees this number. After this screen,
            neither do you.
          </p>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-faint">
            Placement is a geometry heuristic, not a truth about you. From
            here, everything runs on your words and your voice.
          </p>
        </div>
        <div className="mt-auto pt-8">
          <Button onClick={() => router.push("/prompts")}>
            Understood — continue
          </Button>
        </div>
      </div>
    );
  }

  const busy = phase !== "picking";

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-xl font-semibold">Your photos</h1>
      <p className="mt-1 text-sm text-secondary">
        {MIN_PHOTOS}–{MAX_PHOTOS} photos. Analyzed on your device, then kept
        private — nobody sees them until you both choose a reveal.
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
        <Button onClick={submit} disabled={slots.length < MIN_PHOTOS || busy}>
          {phase === "checking" && "Analyzing on your device"}
          {phase === "uploading" && "Uploading"}
          {phase === "picking" && "Continue"}
        </Button>
      </div>
    </div>
  );
}
