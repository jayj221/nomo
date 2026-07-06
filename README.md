# Nomo

No more fake connections. A voice-first, anonymous-first connection app. You write three prompts. People
in your bracket read them. If you both like each other, a live voice call
opens at the next window — a 15-minute period that fires for everyone at once.
Identity reveals step by step, only when both people choose it.

Vocabulary: connect, talk, vibe, skip, window, reveal. Never "match", "swipe",
or "dating" in any UI string.

## Stack

- Next.js 14 (App Router, TypeScript) + Tailwind — dark only
- Supabase — Postgres, Auth, RLS, Realtime, private Storage
- Daily.co — private voice-only WebRTC rooms
- Replicate — server-side photo scoring (never exposed to clients)
- OpenAI Moderation — prompt answers checked before going live
- OneSignal — web push for window notifications
- MediaPipe FaceLandmarker (WASM) — client-side liveness check
- @vladmandic/human — client-side face-presence check on photo upload

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` in full. This creates all
   tables, RLS policies, column-level grants, the private `photos` bucket, the
   signup trigger, and realtime publications.
3. Copy the project URL, anon key, and service-role key into `.env.local`.
4. Optionally regenerate typed clients:
   `npx supabase gen types typescript --project-id <ref> > types/database.types.ts`

### 2. External services

| Service | What you need | Env var |
|---|---|---|
| Daily.co | API key (dashboard → Developers) | `DAILY_API_KEY` |
| Replicate | API token + an aesthetic-scoring model version | `REPLICATE_API_TOKEN`, `REPLICATE_MODEL_VERSION` |
| OpenAI | API key (moderation endpoint is free) | `OPENAI_API_KEY` |
| OneSignal | Web push app (needs your deployed HTTPS origin) | `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY` |

Copy `.env.example` to `.env.local` and fill everything in. Set `CRON_SECRET`
to a long random string.

> Replicate model note: set `REPLICATE_MODEL_VERSION` to the version hash of
> the scoring model you choose. `lib/replicate.ts` expects a model that takes
> an `image` URL input and outputs a single numeric score; clamp/rescale there
> if your model uses a different range.

### 3. Run

```bash
npm install
npm run dev
```

### 4. Deploy (Vercel)

- `vercel.json` schedules the crons: daily curation at 7:50am, anchor windows
  at 9:00 and 20:00, and an hourly 11:00–19:00 tick that fires the third
  window exactly once per day at a uniformly random hour.
- Set the `CRON_SECRET` env var in Vercel — Vercel sends it as a bearer token
  on cron invocations and the cron routes verify it.
- OneSignal requires the deployed HTTPS URL; configure the web push origin in
  the OneSignal dashboard after the first deploy, and set
  `NEXT_PUBLIC_APP_URL` so notification clicks land on `/window`.

## Architecture notes

**Score privacy.** `bracket_score`, `bracket_tier`, and `behavioral_score`
never reach a client. RLS plus column-level grants exclude them from the
`authenticated` role entirely; every ranking query runs through the
service-role client in API routes, and no response payload includes them.

**Reveal gating.** All identity data flows through `lib/reveal.ts`, which
gates on the connection's unlock step: photos at step 3 (signed URL, 15-minute
expiry, private bucket), name/age/city at step 4. Step advancement requires
both participants to consent (`/api/call/unlock-step` only advances when both
flags are set). The client literally has no route to another user's identity
before those flags flip.

**Windows.** A cron inserts a `windows` row and sends the push. Open clients
learn of it via a Realtime subscription (`WindowListener`) and are routed to
the window screen. Calls are created against a window and rate-limited to 3
per window; likes to 10 per day; the browse queue to 10 profiles per day.
These limits are product decisions — do not raise them.

**Anti-bias scoring.** Ending a call within 5 seconds costs the skipper
behavioral score; completed calls and step unlocks add to it. The browse
queue ranks by behavioral-score proximity within the bracket.

## Not yet implemented

- **Voice fingerprinting** — the `voice_fingerprints` table exists (service-
  role access only), but the resemblyzer embedding service is a separate
  Python/FastAPI microservice that isn't part of this repo. Wire it by
  recording 10s of mic audio on first call, POSTing to the service, and
  storing the embedding; verify on subsequent calls and flag mismatches.
- **Admin review queue** — reports land in the `reports` table; there's no
  moderation UI yet.

## A note before launch

This product stores biometric-adjacent data (face landmarks during liveness,
voice embeddings when enabled) and runs hidden algorithmic scoring of user
photos. Both areas are regulated (Illinois BIPA, GDPR, state privacy laws)
and require explicit informed consent, retention policies, and disclosure.
Get a real legal review before shipping this to the public.
