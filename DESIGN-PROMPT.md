# The prompt

Paste this at the start of any Nomo UI work, in any tool. It assumes
`LOVABLE-BRIEF.md` for the design system and does not repeat it.

---

Build one screen of Nomo. Read `LOVABLE-BRIEF.md` first for palette, type,
motion and vocabulary. Follow it exactly. Do not invent tokens.

**Order of work, non-negotiable.** Build it working and ugly first: real
states, real empty states, real error states, real loading, keyboard and
touch behaviour. Confirm it works. Only then style it. Taste applied to a
broken screen is wasted twice.

**One screen per prompt.** Never a flow, never an app.

## Refuse to ship anything with these

They are what machine-made UI looks like. Any one of them and the screen reads
as generated.

- Inter, or any geometric sans as the primary face
- Purple or blue gradients, anywhere, for anything
- Emoji used as an icon
- Every corner at the same radius, every card at the same elevation
- Glassmorphism applied to more than one surface per screen
- Centred text as the default alignment
- Icon + label + chevron rows repeated down a page with no visual hierarchy
- More than one accent colour visible at once
- Motion on everything, or one duration reused for every transition
- Placeholder copy standing in for a real empty state

## What separates it from a template

- **Type does the hierarchy, not weight.** Serif for anything a person says or
  feels, sans for interface, mono for anything the system says. That split is
  the brand. Size and face carry the hierarchy; reaching for bold is the tell.
- **One accent, earned.** `--reveal` green appears only at the moment two
  people connect. Nowhere else, ever. A green success toast breaks the product.
- **Asymmetry on purpose.** Left-aligned copy, off-centre focal points, one
  element that breaks the grid per screen. Perfect symmetry reads as default.
- **Optical spacing, not a scale.** Adjust by eye after rendering. A strict
  8pt grid applied blind is why templates feel flat.
- **Motion is entrances only.** Rise 10-14px, fade, 400-600ms,
  `cubic-bezier(.2,.8,.2,1)`, list children staggered 55ms. Nothing loops,
  nothing bounces. Honour `prefers-reduced-motion`.
- **Empty states are written, not generic.** "No connections yet. Your window
  opens today." not "Nothing here."

## Tools, in order

1. `ui-ux-pro-max` for direction when a screen needs a decision about colour,
   type or layout. It returns real palettes and pairings.
2. Build with Tailwind and hand-written components. Reach for a component
   library only when a screen needs a genuinely hard primitive (date picker,
   virtualised list). Default library styling is the fastest route to looking
   generated.
3. `thinking-orbs` for any thinking, listening or waiting indicator.
4. `@paper-design/shaders-react` or `@shadergradient/react` for the welcome and
   reveal screens only. Lazy-load them. Never in the app shell.
5. `impeccable` to audit before calling a screen done.

## Before it is done

Render it at 390x844 and look at it. Then 360px wide. Then dark. The
validators check colour, not layout.

Name the one element on the screen that a template would not have produced. If
there isn't one, it isn't finished.
