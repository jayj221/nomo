# Nomo · Lovable brief

Two parts. **Part 1** goes into Lovable's Knowledge / project context once, so every
prompt inherits it. **Part 2** is the screen prompts, pasted one at a time in order.

The single most important instruction is in Part 1: build UI only. The backend
already exists and Lovable must not invent a second one.

---

# PART 1 · paste into Knowledge (once)

You are building the UI for **Nomo**, a voice-first dating app. Follow these
rules on every screen. Never invent copy, colours, or features not listed here.

## Hard constraints

- **Do not create a database, auth system, or Supabase project.** One already
  exists. Build presentational screens with mock data and clearly named props.
- **Do not add features I did not ask for.** No settings pages, no notification
  centres, no onboarding carousels, no gamification, no streaks, no badges.
- **Do not use purple or blue gradients.** Do not use Inter. Do not use emoji.
- Mobile-first. Design at 390x844. Everything must work at 360px wide.
- Dark only. There is no light mode.

## Palette (use these exact values)

```
--void      #070608   page background, near-black
--deep      #1c100c   raised surface
--rust      #5a2617   deepest warm tone
--amber     #8f4c27   mid warm tone
--sand      #b8794b   light warm tone
--gold      #d8a874   highlight, used sparingly
--reveal    #1fae82   green. SEE RULE BELOW.
--ink       rgba(255,246,240,.95)   primary text
--ink-2     rgba(232,224,216,.80)   secondary text
--ink-3     rgba(255,236,226,.42)   labels, meta
--line      rgba(255,214,190,.15)   hairlines and borders
```

**The green rule.** `--reveal` is *earned*. It may only appear at the moment two
people connect: a mutual reveal, a match, a window opening. It must never be used
for an ordinary button, link, success toast, or icon. Breaking this rule makes the
whole product feel generic.

## Type

Three roles, never mixed up:

- **Serif** (`"Iowan Old Style", Palatino, Georgia, serif`) — anything a *person*
  says or feels. Prompt answers, names, emotional lines. Often italic.
- **Sans** (system stack) — interface. Buttons, labels, body copy, inputs.
- **Mono** (`ui-monospace, "SF Mono", Menlo, monospace`) — anything the *system*
  says. Timestamps, counters, status, uppercase micro-labels with wide tracking
  (`letter-spacing: .18em; text-transform: uppercase; font-size: .62rem`).

That serif/mono split is the strongest thing in the brand. Keep it strict.

## Surfaces

Cards and sheets:
```
background: linear-gradient(145deg, rgba(32,22,17,.82), rgba(12,8,7,.88));
border: 1px solid rgba(255,214,190,.15);
border-radius: 16px;
box-shadow: 0 2px 12px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.03);
backdrop-filter: blur(14px) saturate(108%);
```

Primary button: warm gradient `linear-gradient(135deg,#e6c6a4,#cd9c6d 55%,#b87f52)`,
text `#241009`, weight 600, radius 12px, full width on mobile.
Secondary button: `rgba(255,240,230,.055)` with a `--line` border.

## Motion

Entrances only, no decoration. Elements rise 10-14px and fade in over 400-600ms
with `cubic-bezier(.2,.8,.2,1)`. Lists stagger children by 55ms. Respect
`prefers-reduced-motion: reduce` and disable all of it.

## Vocabulary (never deviate)

Use: **connect, talk, window, reveal, your ten, bracket.**
Never use: match as a verb, swipe, like, super-like, hot, rate, score, feed.

## Data shapes (these tables already exist, mirror the names)

`users, photos, prompts, likes, passes, connections, messages, calls,
windows, daily_match, reveal_events, reports`

---

# PART 2 · screen prompts, in this order

Paste one at a time. Wait for each to finish before the next.

## 1. Design system

> Set up the Nomo design system from my Knowledge doc as CSS variables and
> reusable components: Button (primary / secondary / ghost), Card, Sheet,
> Label (mono uppercase), PromptCard (mono question, serif italic answer),
> Avatar (circular, supports a blurred state), and Countdown (mono).
> Build a single page showing every component and every colour swatch.
> No app screens yet.

## 2. Welcome

> Build the welcome screen. Full viewport, no scroll. Dark warm background with
> a large soft sun low on the screen and a horizon line, mostly darkness. The
> Nomo wordmark, then a serif line "Ten a day. No faces, not yet.", then a
> primary button "Create account" and a secondary "I already have one".
> Fine print in mono: "18+ · terms & privacy". Everything anchored to the bottom.

## 3. Onboarding, four steps

> Build a four-step onboarding flow with a thin progress indicator at the top.
> Step 1: name and age. Step 2: who you are and who you want to meet, as
> selectable chips. Step 3: three prompt questions with textareas, question in
> mono uppercase, answer typed in serif italic. Step 4: photo upload showing
> three empty slots.
> After the photos upload, show a vault animation: the photos slide behind a
> frosted panel that closes over them and a lock icon drops in and settles.
> Then the line "The AI reads it once to set your bracket. Then it locks." and
> below in green "No human sees it until you both ask."
> This green is the only green in onboarding.

## 4. Home, your ten

> Build the home screen. Mono header: "8:04 am · your ten arrive". A vertical
> list of ten people, each row showing rank number in mono, name in serif, and
> one short vibe tag. No photos anywhere. Rows stagger in 55ms apart.
> Rank 1 is visually distinct but not gaudy.
> At the top, a card showing today's window has not opened yet, with the text
> "At some point today. You'll know when it does."

## 5. Profile

> Build the profile screen for one person. Large circular avatar that is heavily
> blurred, so you cannot tell who it is. Name and age in serif beneath it. Three
> prompt cards with mono question and serif italic answer. Two buttons at the
> bottom: "Talk" as primary, "Not today" as secondary.
> No photo reveal on this screen. No like button, no swipe.

## 6. Window open

> Build the window screen for when a window is live. Big mono countdown showing
> time remaining out of one hour. A voice waveform that animates while a call is
> active. Buttons for "Call" and "Text". Below, a line explaining the window
> closes when the hour is up and does not come back.
> This screen may use the green accent, since the window opening is a connection
> moment.

## 7. The mutual reveal

> Build the reveal flow as three states inside a chat.
> State 1: a chat with two message bubbles, then a centred card asking
> "Show each other?" with the sub-line "You have both been asked. Photos only
> appear if you both say yes." and Yes / Not yet buttons.
> State 2: after tapping Yes, the card changes to "You said yes" and
> "{name} is still deciding" with three animated typing dots. Hold this state
> for 1.9 seconds.
> State 3: their photo appears still blurred with a button "Open it". Tapping it
> makes the photo shake side to side while growing slightly for 1.15 seconds,
> then it bursts and the unblurred photo springs in with their name.
> The waiting state in step 2 is the most important moment. Do not shorten it.

## 8. Connections

> Build the connections list. Each row: avatar (blurred if not yet revealed),
> name in serif, last message preview in sans, timestamp in mono. Empty state
> reads "No connections yet. Your window opens today."

---

## After Lovable is done

Ask it to connect the GitHub repo, then clone it locally so the screens can be
ported into the existing Next.js app and wired to the real routes:
`/api/onboarding/*`, `/api/feed/lineup`, `/api/window/active`, `/api/call/*`,
`/api/messages`, `/api/connections`.

## If output looks generic

The usual causes, in order:

1. The Knowledge doc was not attached. Re-paste Part 1.
2. You asked for a whole app in one prompt. One screen per prompt.
3. You described a feeling rather than values. Give it hex codes and pixel sizes.
4. It invented a backend. Say "do not create any database or auth, UI only" again.
