"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { DailyCall } from "@daily-co/daily-js";
import { createClient } from "@/lib/supabase/client";
import { Waveform } from "@/components/call/Waveform";
import { StepStrip } from "@/components/call/StepStrip";
import { CallTimer } from "@/components/call/CallTimer";
import { UnlockPrompt } from "@/components/call/UnlockPrompt";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import type { RevealPayload } from "@/types/app.types";
import {
  INITIAL_CALL_SECONDS,
  EXTENSION_SECONDS,
  EXTEND_PROMPT_AT_REMAINING,
  PHOTO_UNLOCK_AT,
  NAME_UNLOCK_AT,
  CALL_STEP,
  callStepToConnectionStep,
} from "@/lib/steps";

type Phase = "connecting" | "live" | "ended";

interface PostCall {
  connection_id: string | null;
  duration_seconds: number;
  unlock_step: number;
  reveal: RevealPayload;
}

/* eslint-disable @next/next/no-img-element */

export default function CallPage() {
  const { roomId: callId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const dailyRef = useRef<DailyCall | null>(null);
  const endedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("connecting");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [error, setError] = useState<string | null>(null);
  const [remoteTrack, setRemoteTrack] = useState<MediaStreamTrack | null>(null);

  // Text-session chat: ephemeral, broadcast-only. Nothing is stored —
  // the real chat unlocks at step 5 like everything else.
  const [chat, setChat] = useState<
    { id: string; mine: boolean; content: string }[]
  >([]);
  const [draft, setDraft] = useState("");
  const chatChannelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  const [total, setTotal] = useState(0);
  const [segmentEnd, setSegmentEnd] = useState(INITIAL_CALL_SECONDS);
  const [openerVisible, setOpenerVisible] = useState(true);

  const [myExtend, setMyExtend] = useState(false);
  const [theirExtend, setTheirExtend] = useState(false);
  const [extendHandledAt, setExtendHandledAt] = useState(0);

  const [callStep, setCallStep] = useState(1);
  const [reveal, setReveal] = useState<RevealPayload>({});
  const [unlockWaiting, setUnlockWaiting] = useState(false);
  const [unlockDeclined, setUnlockDeclined] = useState<number[]>([]);

  const [postCall, setPostCall] = useState<PostCall | null>(null);
  const [reported, setReported] = useState(false);

  const endCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    try {
      chatChannelRef.current?.send({
        type: "broadcast",
        event: "left",
        payload: {},
      });
    } catch {}
    try {
      dailyRef.current?.leave();
      dailyRef.current?.destroy();
    } catch {}
    const res = await fetch("/api/call/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: callId }),
    });
    if (res.ok) setPostCall(await res.json());
    setPhase("ended");
  }, [callId]);

  // Join the Daily room
  useEffect(() => {
    let cancelled = false;

    async function connect() {
      let creds: { room_url: string; token: string; mode?: string } | null =
        null;
      const cached = sessionStorage.getItem(`call:${callId}`);
      if (cached) creds = JSON.parse(cached);
      if (!creds) {
        const res = await fetch("/api/call/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ call_id: callId }),
        });
        if (!res.ok) {
          setError("This call isn't available.");
          return;
        }
        const d = await res.json();
        creds = { room_url: d.room_url, token: d.token, mode: d.mode };
        setCallStep(d.unlock_step ?? 1);
      }
      if (cancelled) return;

      if (creds.mode === "text") {
        // No Daily room — realtime broadcast carries the session.
        setMode("text");
        setPhase("live");
        setTimeout(() => setOpenerVisible(false), 10_000);
        return;
      }

      const { default: DailyIframe } = await import("@daily-co/daily-js");
      const daily = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: false,
        subscribeToTracksAutomatically: true,
      });
      dailyRef.current = daily;

      daily.on("track-started", (ev) => {
        if (!ev.participant?.local && ev.track.kind === "audio") {
          setRemoteTrack(ev.track);
        }
      });
      daily.on("participant-left", () => {
        endCall();
      });
      daily.on("app-message", (ev) => {
        if (ev.data?.type === "extend-yes") setTheirExtend(true);
      });
      daily.on("error", () => {
        setError("The call dropped.");
        endCall();
      });

      try {
        await daily.join({ url: creds.room_url, token: creds.token });
        if (!cancelled) {
          setPhase("live");
          setTimeout(() => setOpenerVisible(false), 10_000);
        }
      } catch {
        setError("Couldn't join. The window may have closed.");
      }
    }
    connect();

    return () => {
      cancelled = true;
      try {
        dailyRef.current?.leave();
        dailyRef.current?.destroy();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  // Total-duration ticker; auto-end when the segment expires unextended
  useEffect(() => {
    if (phase !== "live") return;
    const interval = setInterval(() => {
      setTotal((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (mode === "voice" && phase === "live" && total >= segmentEnd) endCall();
  }, [total, segmentEnd, phase, mode, endCall]);

  // Text-session transport
  useEffect(() => {
    if (mode !== "text" || phase !== "live") return;
    const supabase = createClient();
    const channel = supabase.channel(`session:${callId}`);
    channel
      .on("broadcast", { event: "msg" }, ({ payload }) => {
        setChat((prev) => [
          ...prev,
          { id: payload.id, mine: false, content: payload.content },
        ]);
      })
      .on("broadcast", { event: "left" }, () => {
        endCall();
      })
      .subscribe();
    chatChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      chatChannelRef.current = null;
    };
  }, [mode, phase, callId, endCall]);

  // Mutual extension: both said "I'm in" → +2 minutes
  useEffect(() => {
    if (myExtend && theirExtend) {
      setSegmentEnd((e) => e + EXTENSION_SECONDS);
      setMyExtend(false);
      setTheirExtend(false);
      setExtendHandledAt(total);
    }
  }, [myExtend, theirExtend, total]);

  // The other side advanced the step → fetch what we may now see
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`call-row:${callId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `id=eq.${callId}`,
        },
        async (payload) => {
          const newStep = (payload.new as { unlock_step: number }).unlock_step;
          if (newStep > callStep) {
            setCallStep(newStep);
            setUnlockWaiting(false);
            const res = await fetch("/api/call/reveal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ call_id: callId }),
            });
            if (res.ok) {
              const d = await res.json();
              setReveal(d.reveal ?? {});
            }
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, callStep]);

  function sendChat() {
    const content = draft.trim();
    if (!content) return;
    const id = crypto.randomUUID();
    setChat((prev) => [...prev, { id, mine: true, content }]);
    chatChannelRef.current?.send({
      type: "broadcast",
      event: "msg",
      payload: { id, content },
    });
    setDraft("");
  }

  function sayExtend() {
    setMyExtend(true);
    dailyRef.current?.sendAppMessage({ type: "extend-yes" });
  }

  async function sayUnlockYes() {
    setUnlockWaiting(true);
    const res = await fetch("/api/call/unlock-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: callId }),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.both_agreed) {
        setCallStep(d.step);
        setReveal(d.reveal ?? {});
        setUnlockWaiting(false);
      }
    } else {
      setUnlockWaiting(false);
    }
  }

  async function report() {
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: callId }),
    });
    setReported(true);
  }

  // ---------------------------------------------------------- render

  if (error && phase !== "ended") {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
        <p className="text-sm text-bad">{error}</p>
        <Button full={false} variant="secondary" onClick={() => router.push("/window")}>
          Back to the window
        </Button>
      </main>
    );
  }

  if (phase === "ended") {
    const minutes = Math.max(1, Math.round((postCall?.duration_seconds ?? 0) / 60));
    const finalReveal = postCall?.reveal ?? reveal;
    const chatOpen = (postCall?.unlock_step ?? 0) >= 5;
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="text-2xl font-light">That was {minutes} minute{minutes === 1 ? "" : "s"}.</p>

        {finalReveal.photo_url && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <img
              src={finalReveal.photo_url}
              alt=""
              className="h-40 w-40 rounded-card border border-line object-cover"
            />
            {finalReveal.first_name && (
              <p className="text-fg">
                {finalReveal.first_name}
                {finalReveal.age ? `, ${finalReveal.age}` : ""}
              </p>
            )}
            {finalReveal.city && (
              <p className="text-sm text-secondary">{finalReveal.city}</p>
            )}
          </div>
        )}

        <div className="mt-10 w-full max-w-xs">
          {chatOpen && postCall?.connection_id ? (
            <Button onClick={() => router.push(`/connections/${postCall.connection_id}`)}>
              Open chat
            </Button>
          ) : (
            <p className="text-sm text-secondary">See you at the next window.</p>
          )}
          <Button variant="ghost" className="mt-3" onClick={() => router.push("/home")}>
            Done
          </Button>
          <button
            onClick={report}
            disabled={reported}
            className="mt-6 text-xs text-faint underline underline-offset-4"
          >
            {reported ? "Reported. We'll look into it." : "Block or report"}
          </button>
        </div>
      </main>
    );
  }

  const remaining = Math.max(0, segmentEnd - total);
  const showExtend =
    mode === "voice" &&
    phase === "live" &&
    remaining <= EXTEND_PROMPT_AT_REMAINING &&
    total > extendHandledAt;
  const showPhotoUnlock =
    phase === "live" &&
    total >= PHOTO_UNLOCK_AT &&
    callStep === CALL_STEP.VOICE_ONLY &&
    !unlockDeclined.includes(CALL_STEP.VOICE_ONLY);
  const showNameUnlock =
    phase === "live" &&
    total >= NAME_UNLOCK_AT &&
    callStep === CALL_STEP.PHOTO &&
    !unlockDeclined.includes(CALL_STEP.PHOTO);

  return (
    <main className="flex min-h-[85vh] flex-col">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-faint">
          {phase === "connecting" ? "connecting" : "live · anonymous"}
        </span>
        <CallTimer seconds={total} />
      </div>

      {mode === "voice" ? (
        <div className="mt-12">
          <Waveform track={remoteTrack} />
        </div>
      ) : (
        <div className="mt-6 flex max-h-[36vh] flex-col gap-2 overflow-y-auto rounded-card border border-line bg-card p-3">
          {chat.length === 0 && (
            <p className="py-4 text-center text-sm text-faint">
              Text session. It lives and dies with this window.
            </p>
          )}
          {chat.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`max-w-[75%] rounded-card border px-3 py-1.5 text-sm ${
                  m.mine
                    ? "border-white/20 bg-white/10 text-fg"
                    : "border-line bg-bg text-fg"
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Revealed photo slides in from below at step 2+ */}
      {reveal.photo_url && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <img
            src={reveal.photo_url}
            alt=""
            className="h-36 w-36 animate-[slideUp_0.4s_ease-out] rounded-card border border-line object-cover"
          />
          {reveal.first_name && (
            <p className="text-fg">
              {reveal.first_name}
              {reveal.age ? `, ${reveal.age}` : ""}
            </p>
          )}
          {reveal.city && <p className="text-sm text-secondary">{reveal.city}</p>}
        </div>
      )}
      {!reveal.photo_url && (
        <div className="mt-8 flex justify-center">
          <Avatar size={96} />
        </div>
      )}

      <div className="mt-10">
        <StepStrip step={callStepToConnectionStep(callStep)} />
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4">
        {openerVisible && phase === "live" && (
          <div className="rounded-card border border-line bg-card p-4 text-center">
            <p className="text-sm text-secondary">
              Start with your opener. Make it real.
            </p>
          </div>
        )}

        {showPhotoUnlock && (
          <UnlockPrompt
            title="Want to see each other?"
            yesLabel="Yes"
            noLabel="Keep going blind"
            waiting={unlockWaiting}
            onYes={sayUnlockYes}
            onNo={() => setUnlockDeclined((d) => [...d, CALL_STEP.VOICE_ONLY])}
          />
        )}
        {showNameUnlock && (
          <UnlockPrompt
            title="Want names?"
            yesLabel="Yes"
            noLabel="Not yet"
            waiting={unlockWaiting}
            onYes={sayUnlockYes}
            onNo={() => setUnlockDeclined((d) => [...d, CALL_STEP.PHOTO])}
          />
        )}
        {callStep === CALL_STEP.NAME_PROFILE && (
          <UnlockPrompt
            title="Keep talking after this call?"
            yesLabel="Open chat"
            noLabel="Leave it here"
            waiting={unlockWaiting}
            onYes={sayUnlockYes}
            onNo={() => setUnlockDeclined((d) => [...d, CALL_STEP.NAME_PROFILE])}
          />
        )}

        {mode === "text" ? (
          <div className="flex gap-2">
            {/* Skip: always available, zero friction, no confirmation */}
            <Button variant="danger" full={false} onClick={endCall} className="px-4">
              Skip
            </Button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat();
              }}
              placeholder="Type"
              maxLength={500}
              className="min-w-0 flex-1 px-4 py-3 text-sm"
            />
            <Button full={false} onClick={sendChat} className="px-4">
              Send
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            {/* Skip: always available, zero friction, no confirmation */}
            <Button variant="danger" onClick={endCall}>
              Skip
            </Button>
            <Button
              variant={showExtend ? "primary" : "secondary"}
              onClick={sayExtend}
              disabled={!showExtend || myExtend}
            >
              {myExtend
                ? "Waiting for them"
                : showExtend
                  ? `I'm in — extend (${remaining}s)`
                  : "Extend"}
            </Button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(24px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
