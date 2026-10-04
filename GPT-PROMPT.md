# Paste-ready prompt for GPT

Copy everything below the line. Replace `<SCREEN>` with one screen name.

---

You are building one screen of **Nomo**, a voice-first dating app. Ten matches a
day, no photos until two people talk, one unpredictable hour to connect.

Build **`<SCREEN>`**. One screen only. Not a flow, not an app.

## Order of work, non-negotiable

Build it working and ugly first: real data shapes, real empty state, real error
state, real loading state, keyboard and touch behaviour, focus order. Confirm
it works. **Only then style it.** Taste applied to a broken screen is wasted
twice.

## Stack

Next.js App Router + React + TypeScript + Tailwind. A **web app**, not native.
Mobile first: design at 390px, must work at 360px, and must hold up at desktop
width without turning into a stretched phone layout. Dark only, no light mode.
Use Motion for animation. Use a component library only for a genuinely hard
primitive (date picker, virtualised list); default library styling is the
fastest route to looking generated.

## Palette — use these exact values

```
--void    #070608   page ground
--deep    #1c100c   raised surface
--rust    #5a2617   deepest warm
--amber   #8f4c27   mid warm
--sand    #b8794b   light warm
--gold    #d8a874   highlight, sparing
--reveal  #1fae82   green
--ink     rgba(255,246,240,.95)
--ink-2   rgba(255,240,232,.68)
--ink-3   rgba(255,236,226,.42)
--line    rgba(255,214,196,.14)
```

**The green rule.** `--reveal` is earned. It appears only at the moment two
people connect: a mutual reveal, a window opening. Never an ordinary button,
link, success toast or icon. A green success message breaks the product.

## Type — three roles, never mixed

- **Serif** (`Iowan Old Style, Palatino, Georgia, serif`) — anything a *person*
  says or feels. Prompt answers, names, emotional lines. Often italic.
- **Sans** (system stack) — interface. Buttons, labels, inputs.
- **Mono** (`ui-monospace, SF Mono, Menlo`) — anything the *system* says.
  Timestamps, counters, status, uppercase micro-labels at
  `letter-spacing:.18em; text-transform:uppercase; font-size:.62rem`.

Size and face carry hierarchy. Reaching for bold weight is the tell.

## Surfaces

```css
background: linear-gradient(145deg, rgba(32,22,17,.82), rgba(12,8,7,.88));
border: 1px solid rgba(255,214,196,.14);
border-radius: 16px;
box-shadow: 0 2px 12px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.03);
```

Primary button: `linear-gradient(135deg,#e6c6a4,#cd9c6d 55%,#b87f52)`, text
`#241009`, weight 600, radius 12px, full width on mobile.
Secondary: `rgba(255,240,230,.055)` with a `--line` border.

## Motion

Entrances only. Rise 10-14px and fade over 400-600ms with
`cubic-bezier(.2,.8,.2,1)`. Lists stagger children 55ms. Nothing loops, nothing
bounces, nothing pulses. Honour `prefers-reduced-motion`.

## Vocabulary

Use: connect, talk, window, reveal, your ten, bracket.
Never: match as a verb, swipe, like, super-like, hot, rate, score, feed.

Never display or describe a score, rating or ranking of a person. Describe
outcomes instead.

## Refuse to ship anything with these

Any one of them and the screen reads as machine-generated.

- Inter, or any geometric sans as the primary face
- Purple or blue gradients, anywhere
- Emoji used as an icon
- Every corner the same radius, every card the same elevation
- Glassmorphism on more than one surface per screen
- Centred text as the default alignment
- Icon + label + chevron rows repeated down a page with no hierarchy
- More than one accent colour visible at once
- One duration reused for every transition
- Placeholder copy standing in for a real empty state

## What makes it not a template

- **Asymmetry on purpose.** Left-aligned copy, off-centre focal points, one
  element per screen that breaks the grid.
- **Optical spacing.** Adjust by eye after rendering. A strict 8pt grid applied
  blind is why templates feel flat.
- **Written empty states.** "No connections yet. Your window opens today." Not
  "Nothing here."

## Before you call it done

Render at 390x844, then at 360px wide. Look at it.

Then name the one element on this screen that a template would not have
produced. If there isn't one, it isn't finished.
