"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Step = "look_left" | "blink" | "smile";
type Status = "idle" | "running" | "passed" | "failed" | "blocked";

const STEP_ORDER: Step[] = ["look_left", "blink", "smile"];
const STEP_LABEL: Record<Step, string> = {
  look_left: "Look left",
  blink: "Blink",
  smile: "Smile",
};
const TIME_LIMIT_MS = 30_000;
const MAX_TRIES = 2;

const YAW_THRESHOLD_DEG = 20;
const BLINK_THRESHOLD = 0.5; // both eyeBlink blendshapes above this
const SMILE_THRESHOLD = 0.5;

function blendshape(categories: { categoryName: string; score: number }[], name: string): number {
  return categories.find((c) => c.categoryName === name)?.score ?? 0;
}

/** Head yaw (degrees) from the column-major 4x4 facial transform matrix. */
function yawDegrees(m: number[]): number {
  return Math.abs((Math.atan2(m[8], m[10]) * 180) / Math.PI);
}

export function LivenessCheck() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>();
  const [status, setStatus] = useState<Status>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    setStepIndex(0);
    setStatus("running");
    setSecondsLeft(30);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
    } catch {
      setError("We need camera access to verify you're a real person.");
      setStatus("idle");
      return;
    }
    const video = videoRef.current!;
    video.srcObject = stream;
    await video.play();

    // MediaPipe FaceLandmarker via WASM from CDN
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );
    const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });

    const startedAt = Date.now();
    let currentStep = 0;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setSecondsLeft(Math.max(0, Math.ceil((TIME_LIMIT_MS - elapsed) / 1000)));

      if (elapsed > TIME_LIMIT_MS) {
        landmarker.close();
        stream.getTracks().forEach((t) => t.stop());
        const nextTries = tries + 1;
        setTries(nextTries);
        setStatus(nextTries >= MAX_TRIES ? "blocked" : "failed");
        return;
      }

      const result = landmarker.detectForVideo(video, performance.now());
      const shapes = result.faceBlendshapes?.[0]?.categories;
      const matrix = result.facialTransformationMatrixes?.[0]?.data;

      if (shapes && matrix) {
        const step = STEP_ORDER[currentStep];
        let passed = false;
        if (step === "look_left") {
          passed = yawDegrees(Array.from(matrix)) > YAW_THRESHOLD_DEG;
        } else if (step === "blink") {
          passed =
            blendshape(shapes, "eyeBlinkLeft") > BLINK_THRESHOLD &&
            blendshape(shapes, "eyeBlinkRight") > BLINK_THRESHOLD;
        } else if (step === "smile") {
          passed =
            blendshape(shapes, "mouthSmileLeft") > SMILE_THRESHOLD ||
            blendshape(shapes, "mouthSmileRight") > SMILE_THRESHOLD;
        }

        if (passed) {
          currentStep++;
          setStepIndex(currentStep);
          if (currentStep >= STEP_ORDER.length) {
            landmarker.close();
            stream.getTracks().forEach((t) => t.stop());
            complete();
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function complete() {
    setStatus("passed");
    const res = await fetch("/api/onboarding/liveness", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Try again.");
      setStatus("idle");
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-xl font-semibold">One last thing</h1>
      <p className="mt-1 text-sm text-secondary">
        We need to confirm you&apos;re a real person. Nothing is stored —
        this runs entirely on your device.
      </p>

      <div className="relative mt-6 aspect-[3/4] w-full overflow-hidden rounded-card border border-line bg-card">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full scale-x-[-1] object-cover"
        />
        {status === "running" && (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-4 text-center">
            <p className="text-lg font-medium">
              {STEP_LABEL[STEP_ORDER[stepIndex]]}
            </p>
            <p className="mt-1 text-xs text-secondary">
              {stepIndex}/3 done · {secondsLeft}s left
            </p>
          </div>
        )}
        {status === "passed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-good">Verified</p>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}
      {status === "failed" && (
        <p className="mt-4 text-sm text-secondary">
          Didn&apos;t quite catch that. One more try.
        </p>
      )}
      {status === "blocked" && (
        <p className="mt-4 text-sm text-bad">
          We couldn&apos;t verify you. Try in better lighting.
        </p>
      )}

      <div className="mt-auto pt-8">
        {(status === "idle" || status === "failed") && (
          <Button onClick={start}>
            {status === "failed" ? "Try again" : "Start check"}
          </Button>
        )}
      </div>
    </div>
  );
}
