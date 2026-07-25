# NOMO — Complete App Design Brief

> Paste this whole document into Claude (or any design tool) to generate the app screen by screen. It contains the product, the exact visual system, and a minute-detail spec for every screen. A condensed "master prompt" is at the very end if you want to generate everything in one shot.

---

## 1. What Nomo is

**One line:** Ten guaranteed matches a day, in your league, whose photos stay blurred until you earn the reveal — because you talk first.

**The problem:** Dating apps optimise for the tenth-of-a-second face judgment and endless swiping that goes nowhere. They're built to keep you scrolling, not to get you off the app.

**The fix:** Every day you get exactly ten matches, AI-picked to be on your level and ranked by how much of your world they share. You see their name, age, and one-word hobbies — but their photo is **blurred**. You get **two reveals a day**, so you spend them with intention. Once a day, a one-hour window opens for everyone at once; mutual interest becomes a live voice (or text) conversation. Talk first. Faces come later.

**Tone of the whole product:** calm, intentional, a little clinical, adult. It should feel like a well-made instrument, not a toy. No confetti, no hearts-flying animations, no dopamine slot-machine.

**Vocabulary rule:** Use *match, connect, talk, vibe, window, reveal, skip*. Avoid *swipe, hot-or-not*. Never use manipulative growth-hack UI (fake urgency, dark patterns).

### The core loop
1. **Onboard** — upload photos (private, on-device analysis for bracket), write 2–3 prompts, pick vibe tags, set who you want to meet.
2. **Get your ten** — each morning, ten matches: blurred photo + name + age + one-word hobbies. Tap for the full profile.
3. **Reveal, sparingly** — unblur up to two photos a day to decide who's worth it.
4. **Mark who you'd talk to.**
5. **The window** — once daily, one hour, everyone at once. Mutual marks become live calls, voice-first, text if preferred.
6. **Keep or move on** — if you both want more after the window, you become a real match with daily chat and socials on your terms. If not, tomorrow brings ten more.

---

## 2. Design system (use these exact values)

### Color
| Token | Hex / value | Use |
|---|---|---|
| `--bg` | `#0a0b0d` | app background (cool near-black) |
| `--card` | `#101216` | cards, sheets |
| `--card-2` | `#16191e` | nested surfaces, chat bubbles |
| `--line` | `rgba(255,255,255,0.09)` | hairline dividers, card borders |
| `--line-strong` | `rgba(255,255,255,0.17)` | inputs, active borders |
| `--ink` | `rgba(255,255,255,0.92)` | primary text |
| `--ink-2` | `rgba(255,255,255,0.56)` | secondary text |
| `--ink-3` | `rgba(255,255,255,0.30)` | muted labels, placeholders |
| `--white` | `#ffffff` | primary buttons (white bg, black text) |
| `--green` | `#1fae82` | the "connection earned" accent — reveals, matches, success ONLY |
| `--blush` | `#C98B8B` | logo accent, the sensual note — used sparingly |
| `--brown` | `#8B6355` | logo second dot |
| `--red` | `#E24B4A` | errors, skip, destructive only |

The app is **fully dark, single theme**. This is a deliberate committed identity, not a light/dark toggle. Green is precious — it appears only at genuine connection moments (a reveal, a match, a mutual yes), never as generic UI chrome.

### Typography (three voices)
- **Sans (UI):** system stack — `-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Everything structural.
- **Serif italic (the human voice):** `"Iowan Old Style", Palatino, Georgia, serif`, italic. Used **only** for prompt answers — the words people write. Makes them feel personal, not like form fields.
- **Mono (the instrument voice):** `ui-monospace, "SF Mono", Menlo, Consolas`. Uppercase micro-labels, countdown timers, section eyebrows. Letter-spacing 0.16–0.24em.

Type scale: display 2.4–3rem/600; H1 1.7rem/600; H2 1.2rem/600; body 0.95–1.08rem/400; caption 0.8rem; micro-label 0.64rem mono uppercase. Line-height 1.5–1.6 for body. `text-wrap: balance` on headings.

### Shape, spacing, motion
- **Radii:** cards 12px, buttons 6–8px, avatars & dots 50%, pills 999px.
- **Spacing:** 8px base grid. Generous section padding (mobile screens breathe).
- **Buttons:** primary = white fill, black text, weight 600. Secondary = transparent, 1px `--line-strong` border, white text. Ghost = text only, `--ink-3`. Full-width on mobile.
- **Motion:** flat and restrained. **No** gradients-as-decoration, no glow, no shadows, no bounce. The **only** signature animation is the **voice waveform** on the call screen (bars reacting to audio). Allowed micro-motion: blur→sharp on a photo reveal (~0.4s), a soft slide-up when a card enters, a slow pulse on a "live/interactive" dot, scroll-settle between sections. Respect `prefers-reduced-motion`.

### Logo
Two overlapping thin rings (the two people; the two o's of "nomo"), their overlap forming an almond shape lightly filled in `--blush`. Wordmark: lowercase monoline "nomo" with round terminals; the two o's each hold a small filled dot (first `--brown`, second `--blush`). Use the full lockup as the app's launch/hero mark and a small mark in nav.

### The signature avatar treatment
People's photos are the product's tension. Everywhere pre-reveal, a photo is shown **blurred** (Gaussian ~10–12px, slight desaturate, subtle scale-up so no hard edges peek). On reveal, it animates to sharp over ~0.4s. Before any real photo exists (sample data), use an abstract radial-gradient avatar with a soft bust silhouette — never a cartoon face.

---

## 3. Screen-by-screen spec

> Device frame: mobile-first, iPhone-class (390×844). Every screen is a full-height dark canvas. Bottom tab bar on the main app screens only.

### A. Splash / Welcome
- Centered logo lockup (large), tagline beneath in `--ink-2`: "Ten guaranteed matches a day. No photos until you talk."
- Bottom: primary button "Create account", ghost link "I have an invite".
- Nothing else. Lots of negative space. Logo is the hero.

### B. Auth (sign up / log in)
- Email + password fields (dark inputs, `--card` bg, `--line-strong` border, focus lifts border to `rgba(255,255,255,0.45)`).
- Primary button. Small legal line: links to Terms & Privacy (required). Toggle between sign-up/sign-in.

### C. Onboarding 1 — Photos (real upload)
- Progress: 4-segment thin bar at top, first segment filled.
- H2 "Your photos". Sub: "Analysed on your device, then kept private. Nobody sees them un-blurred until you spend a reveal."
- A 3×2 grid of square upload slots (radius 10px). Empty slot = dashed border, centered "+" in `--ink-3`. Tapping opens the device photo picker (**real file upload**). Filled slot shows the photo with a small ✕ to remove.
- Minimum 2, max 6. Continue button disabled until 2 uploaded.
- On continue: a brief "Analysing…" state (this is where face-geometry bracket scoring runs — see legal note below).

### D. Onboarding 2 — Placement (shown once, only to them)
- Micro-label: "Your placement · shown once, only to you".
- A card, centered: a single large number (e.g. **7**) in light weight, "of 10 brackets" beneath in `--ink-2`.
- Copy: "Everyone in your daily ten is in this bracket. Nobody, including them, ever sees this number. After this screen, neither do you." Then a small `--ink-3` line: "A geometry heuristic, not a truth about you."
- Primary: "Understood, continue".
- ⚠️ **Legal**: attractiveness scoring from facial geometry is biometric-adjacent and reputationally sensitive. Frame as private *placement*, never a public grade. This feature needs a consent screen + legal review before real launch (see the roadmap doc).

### E. Onboarding 3 — Prompts
- H2 "Say something real". Sub: "Two or three answers. This is what people read first."
- A list of prompt questions (from a bank of ~10). Tap one to expand an inline textarea (max 200 chars, live counter). Selected prompts show the **answer in serif italic**. Pick 2–3.
- Moderation runs on submit; a flagged answer shows inline: "That answer won't work here. Try again."

### F. Onboarding 4 — Vibe tags
- H2 "Your vibe". Sub: "Pick 3–8. Your daily ten is ranked by how much of this you share."
- A wrap of pill toggles (music + mentality: indie, techno, hip-hop, jazz, deep talks, film nerd, gym, foodie, night owl, traveller, artist, bookworm…). Selected = white fill / black text. Counter shows "n picked".

### G. Onboarding 5 — About you
- First name, age (18+ enforced), city. Gender: Guy / Girl / Nonbinary (pill row). "I want to meet": Girls / Guys / Everyone (pill row). This drives who appears in the daily ten.

### H. Onboarding 6 — Verify you're real (liveness)
- Front-camera step: "Look left → blink → smile", one instruction at a time, a 30s limit, progress "1/3 done". On pass → verified.
- ⚠️ **Legal**: this captures face data. Needs explicit consent + on-device processing + retention policy. Can be deferred for v1.

### I. HOME — Today's ten  ★ (the heart of the app — spec this most carefully)
- Top bar: small nomo mark left; right side a **reveal counter** pill — a small eye/unlock glyph + "2 left" (in `--ink-2`, turns `--ink-3` when 0). Mono micro-label under the bar: "Today's ten · ranked by shared vibe".
- Body: a vertical scroll of **ten match cards**. Each card (`--card` bg, `--line` border, radius 12px, ~16px padding):
  - **Left:** the person's **blurred photo**, a rounded square ~64–72px (Gaussian blur, slightly desaturated). If revealed, it's sharp.
  - **Right (main):** **Name, age** in `--ink` (e.g. "Aanya, 26"), weight 600, ~1.05rem. **Directly under it, smaller (`0.8rem`, `--ink-2`): one-word hobbies** separated by thin dots — e.g. "techno · running · dogs". Optionally a faint rank chip (#1…#10) at the far right.
  - **Reveal control:** on the card, a small "Reveal" button (secondary style). Tapping it: if reveals remain, the blurred photo animates blur→sharp (~0.4s) and the counter decrements with a subtle tick; if none remain, the button is disabled and a tooltip/inline line says "You've used both reveals today. More tomorrow."
  - **Tap the card body** (not the reveal button) → opens the full profile (screen J).
  - A subtle state marker if you've already marked them ("marked", small green pill) or it's mutual ("mutual", green).
- Ranked #1 at top (most vibe overlap). After all ten are acted on / it's late: an empty state "That's your ten for today. More at 8am." 
- Footer micro-label: "Ten a day. One window. Two reveals."
- **Do not** add infinite scroll, a "see more" button, or a swipe deck. Exactly ten, calm and finite.

### J. Match profile (detail)
- Back chevron → Today's ten.
- Header: blurred (or revealed) photo, larger; Name, age; one-word hobbies row (small); the rank/bracket note "#3 in your ten".
- Full vibe tags as pills.
- Their 2–3 **prompt answers** in serif italic cards (question in mono micro-label above each answer).
- The reveal button here too (shares the same 2/day budget as Home).
- Primary action: "I'd talk to them" (marks them). Under it, `--ink-3`: "If they mark you too, you connect at the next window."

### K. The Window (the daily event)
- Triggered by a push ("Your window is open. One hour.") and a realtime redirect if the app is open.
- Top: mono label "window open" in `--green`. A large **countdown** in mono tabular numerals (e.g. 59:48), counting down from 60:00.
- "Available now" list: your mutual marks, shown as compact rows (small blurred avatar, "#1 · today's ten" or "Person 2"), each with two actions: **Talk** (primary, voice) and **Text** (secondary). Voice is listed first — it's the emphasis.
- Empty state if no mutuals yet: "No one available yet. Mutual marks appear here when a window opens."

### L. Call (voice-first, text optional)
- Full-screen, minimal. Top row: mono "LIVE · ANONYMOUS" left, a small total-duration timer right.
- Center: the other person's **blurred** avatar (still blurred — you're talking, not seeing yet).
- Below it: the **waveform** — the app's one animated element — reacting to the remote voice.
- A 5-dot **unlock strip** (mono), dots fill left→right as you progress (voice → photo → name → chat).
- An opener card appears for the first ~10s: "Start with your opener. Make it real." then auto-dismisses.
- Bottom: **Skip** (danger, zero-friction, no confirm) and **Extend / I'm in** (secondary; at 1:00 left both must tap to add time).
- **Text mode variant:** replaces the waveform with a live chat thread; same skip/timer; input + send at the bottom.

### M. In-call reveal (mutual consent)
- At a milestone, a card: "The hour is going well. Ask to see each other? It only happens if you both ask." — [Reveal my photo] [Not yet].
- If both ask: the blurred avatar animates blur→**sharp**, the unlock strip turns green, caption in `--green`: "Aanya asked too. You both said yes, so you can see each other's photos."
- Later milestone unlocks name/age/city the same mutual way.
- Uses the same 2-reveals-a-day budget.

### N. Post-call / It's a match
- If it went well and both kept going: full revealed photo, "Aanya, 26", "Your match. She said yes too." in `--green`. A first chat bubble ("so… same time tomorrow?"), social chips (Instagram, Spotify). Primary "Open chat".
- If it ended early: "See you at the next window." Option to block/report (always present, low-friction).

### O. Connections (list)
- All your matches. Each row: avatar (revealed if you've reached that step), name, a tiny unlock-progress strip, and a state pill ("chat open" green / "next window").
- Tap → chat (if unlocked).

### P. Chat + social handoff
- Standard dark chat: incoming bubbles `--card-2` left-rounded, your bubbles `rgba(255,255,255,0.1)` right-rounded. Realtime.
- A collapsible "Share on your terms" section: four platform tiles (Instagram, TikTok, Spotify, Apple Music), each with a handle field and "Share with them". You each only see the other's handle once you've both shared that platform. Privacy note: "The app never accesses your account. Just the handle you type."

### Q. Profile / Settings
- Your photos, prompts, vibe tags (editable). Account, notifications, privacy controls (download/delete data — required), block list, sign out. Never shows your own bracket number.

### R. System states (design these too)
- **Push notification** for the window (no emoji, no exclamation: "Your window is open. You have one hour.").
- Empty states, loading (a calm shimmer, not a spinner circus), error toasts (`--red`, plain language + how to fix), offline, and the "used both reveals" state.

---

## 4. Component inventory (build these as reusable pieces)
Button (primary/secondary/ghost/danger) · Input & textarea · Pill toggle · Match card (blurred-photo + name/age + hobbies + reveal) · Prompt-answer card (serif) · Blurred avatar (with reveal transition) · Countdown timer · Waveform · Unlock-strip dots · Bottom tab bar · Reveal-counter pill · Chat bubble · Social-share tile · Bottom sheet / modal · Micro-label eyebrow · Progress segments.

---

## 5. Voice & copy rules
Plain, warm, adult. Short sentences. No em dashes in UI microcopy (use periods or commas). No hype, no fake scarcity. Buttons say exactly what happens ("Reveal my photo", then it reveals). Errors explain and guide. Never the words swipe / hot / rate.

---

## 6. Legal guardrails to reflect in the design
- 18+ age gate (real date of birth, not just a checkbox).
- Explicit consent screens before any camera/biometric step.
- Reporting + blocking reachable from every person surface.
- Privacy & Terms linked at sign-up.
- The attractiveness-bracket and any face/voice biometric features are the highest-risk parts — design consent + private framing, and get legal review before launch. (See the founder roadmap.)

---

## 7. MASTER PROMPT — copy this to generate the app in one shot

> Design a mobile-first dating app called **Nomo**, fully dark single-theme, calm and clinical and adult (never playful or gamified). Core idea: users get **ten guaranteed matches a day** in their attractiveness bracket; each match shows a **blurred photo, name, age, and one-word hobbies in small text underneath**, and users can **reveal only 2 photos per day**; once a day a **one-hour window** opens for everyone at once where mutual matches talk **voice-first (text optional)**, and photos reveal only by mutual consent.
>
> **Design system:** background #0a0b0d, cards #101216, nested #16191e; hairlines rgba(255,255,255,0.09); text #ffffff at 92/56/30% opacity for primary/secondary/muted; primary buttons white with black text; one precious accent green #1fae82 used ONLY at connection moments (reveals, matches, success); a blush #C98B8B logo accent. Radii: cards 12px, buttons 8px, avatars/dots round. Three type voices: system sans for UI, **serif italic** ONLY for user-written prompt answers, and monospace uppercase (letter-spaced) for micro-labels and countdown timers. Flat and restrained: no gradients-as-decoration, no glows, no shadows; the only animation is a voice waveform on the call screen plus a blur→sharp transition when a photo is revealed. Logo: two overlapping thin rings + lowercase monoline "nomo" wordmark with a small dot inside each o.
>
> **Screens to design (all dark, mobile 390×844, bottom tab bar on main screens):** (1) Splash with centered logo; (2) Sign up / log in; (3) Onboarding — real photo upload grid (2–6); (4) Placement reveal ("bracket 7 of 10", shown once, private); (5) Prompts (pick 2–3, answers in serif italic); (6) Vibe tags (pill toggles); (7) About you + who you want to meet; (8) **HOME / Today's ten** — a vertical list of ten cards, each with a **blurred rounded-square photo on the left, name + age on the right, one-word hobbies in smaller muted text directly under the name, and a "Reveal" button**; a "2 left" reveal counter in the top bar; tapping Reveal animates the photo blur→sharp and decrements the counter; tapping the card opens the profile; exactly ten, no infinite scroll; (9) Match profile detail (blurred/revealed photo, name/age, hobbies, vibe pills, prompt answers in serif, reveal button, "I'd talk to them"); (10) The Window (green "window open" label, a large monospace countdown from 60:00, a list of available mutual matches each with Talk and Text buttons); (11) Call screen (blurred avatar, animated waveform, 5-dot unlock strip, Skip and Extend buttons, opener card); (12) In-call mutual reveal (two "Reveal my photo" consents, then blur→sharp with green caption); (13) It's a match (revealed photo, green success, first chat bubble, social chips, Open chat); (14) Connections list; (15) Chat + a "share your socials on your terms" section; (16) Profile/settings (never shows own bracket number). Include empty states, the window push notification, and an "used both reveals today" state. Copy is plain, warm, adult, no em dashes, never the word "swipe".
