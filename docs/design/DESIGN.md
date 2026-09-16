# BrainWaves — Design Archaeology

Documented from 8 screenshots in `docs/design/archaeology/screenshots/` (2 of the
current app: My Experiments, Experiment Bank; 6 frames of the original V1 demo
video: Edit Design tabs, Experimental Protocol, Collect, Subject/Session modal),
cross-checked against `tailwind.config.js`, `src/renderer/app.global.css`, and
`src/renderer/components/ui/`. This documents what exists — it is not a redesign.

---

## 1. Color palette

### Brand
| Hex | Token | Role |
|---|---|---|
| `#007c70` | `brand` | Primary teal. Filled primary buttons, V1 outlined buttons, slider handles, logo wordmark, link variant text |
| `#00635a` | `brand-dark` | Primary button hover |
| `#e6f2f1` | `brand-light` | Teal tint background (defined; rarely seen in screenshots) |
| `#ffc107` | `accent` | Gold. Active/visited nav underline (`border-accent`), active stepper bubble, active tab underline in V1, selected-tab outline box on home nav, illustration base color |
| `#ffe69c` | `accent-light` | Gold tint. Nav hover underline |

### Signal quality (Collect screen head map + EEG traces)
| Hex | Token | Role |
|---|---|---|
| `#66b0a9` | `signal-great` | Strong signal (muted teal — deliberately not `brand`) |
| `#ffcd39` | `signal-ok` | Mediocre signal (a *different* gold than `accent`) |
| `#e06766` | `signal-bad` | Weak signal |
| `#bfbfbf` | `signal-none` | No signal |

The EEG trace lines on Collect reuse these four as series colors.

### Text
| Hex | Role |
|---|---|
| `#1a1a1a` | Primary text, active/visited nav labels |
| `#666` | Muted text, visited stepper bubble, initial nav label |
| `#ccc` | Disabled/initial stepper bubble, slider rail/track/dots |

Body copy otherwise uses Tailwind grays: `text-gray-900` on buttons, `gray-100/200`
secondary button fill+hover, `gray-300` outline button border.

### Backgrounds
| Value | Role |
|---|---|
| `linear-gradient(to bottom, #f9f9f9, #f0f0ff)` | Main screen background (`bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]`) — white fading to a faint lavender |
| `rgba(255, 255, 255, 0.2)` | `body` background (translucent white; the gradient screens paint over it) |
| `#fff` | Cards, table rows, head-diagram electrodes |

### Feedback
| Value | Role |
|---|---|
| `red-600` / `red-700` (`#dc2626` / `#b91c1c`) | Destructive button + hover (Tailwind palette, not a custom token) |
| macOS traffic lights aside, no other status colors exist — success/info states lean on brand teal |

## 2. Typography

**Family:** `Lato, "Helvetica Neue", sans-serif` (body-wide, `app.global.css`).
V1 frames show the same Lato humanist look with large light-weight headings.

**Scale (as it actually exists — two systems in force):**

Global CSS (px, `!important`):
- `h1` — 36px / 44px line-height, weight **normal**, letter-spacing 1.29px. The big airy V1 headings ("Stimuli Groups", "Research Question").
- `h2` — 2.25rem (36px), weight **bold**, letter-spacing −0.025em.
- `p` — 18px, letter-spacing 0.64px.
- `.info` — 16px, letter-spacing 0.64px.

Tailwind utilities (rem, used in components):
- `text-xs` (12px) — badges, stepper bubble numerals, `sm` buttons
- `text-sm` (14px) — buttons (`font-medium`), nav labels (`font-bold`, `tracking-[0.5px]`, ALL CAPS in nav)
- `text-lg` (18px) — card/section headings (most common heading utility in components)
- `text-2xl` (24px) — page-level headings

**Rules observed:**
- Big headings are *light/normal weight and large*, never bold-and-large (V1 signature).
- Nav and tab labels are 14px bold uppercase with ~0.5px tracking.
- `rc-slider` mark labels: 14px.

## 3. Spacing rhythm

- **Grid:** Tailwind's 4px scale. No custom spacing tokens exist.
- **Buttons:** heights h-8 / h-9 / h-10 (32/36/40px), `px-4 py-2` default, `px-3` sm, `px-6` lg.
- **Radius:** `--radius: 0.375rem` (6px) = `rounded-lg`; md = 4px; sm = 2px. Cards and buttons use `rounded-md`/`rounded-lg` — everything is slightly rounded, nothing pill-shaped.
- **Nav:** active indicator is a `border-b-4` (4px) underline; segments `px-4`, stepper bubbles 23×23px with 2px border, `gap-2` to the label.
- **Page margins:** wide, symmetric gutters (~136px at 1920w in screenshots); content column is full-bleed within them.
- **List rows:** ~85px tall white rows with ~16px vertical gaps between rows (row-cards, not a flush table).
- **Card grid:** 2 columns, ~20px gutter, ~230px tall cards with generous internal padding (~40px).
- **V1 sections:** three equal columns, huge top whitespace (~200px between tab bar and content) — airy, presentation-like.
- **Slider (rc-slider):** 32×32px teal handle, 10px dots — oversized touch targets, classroom-friendly.

## 4. Component taxonomy

**shadcn/ui primitives** (`src/renderer/components/ui/`): Button, Card, Dialog, DropdownMenu, Select, Badge, Table, Spinner.

- **Button variants:** `default` (filled `bg-brand` white text), `secondary` (gray-100), `outline` (gray-300 border, transparent), `ghost`, `destructive` (red-600), `link` (teal underline). Global `button:active { scale(0.95) }` press effect on *all* buttons.
- **V1 button language (still visible in video frames):** outlined teal rectangles — ~2px `#007c70` border, teal text, white fill ("Save Workspace", "Select Folder", "Start Pre-Test", "Cancel") — with filled teal reserved for the single primary action ("Run & Record Experiment", "Next").

**App-specific components:**
- **Stepper nav** (`PrimaryNavSegment`) — numbered circle (1–4) + uppercase label, three states: `initial` (gray), `active`/`visited` (dark text, gold `border-b-4` underline; bubble gold when active, gray when visited).
- **Secondary tab nav** (`SecondaryNavSegment`) — uppercase labels, gold underline on active (V1: "OVERVIEW / BACKGROUND / EXPERIMENTAL PROTOCOL / PREVIEW").
- **Row-card list** — white rounded rows: name left, timestamp center, right-aligned action cluster (two neutral buttons + one filled teal).
- **Experiment card** — white rounded card: flat illustration left (~180px), title + description right.
- **Head diagram SVG** — electrode circles filled with signal-quality colors, dot legend below.
- **EEG viewer** — multichannel trace stack, channel labels left, series colored by signal quality.
- **Slider** — rc-slider with `#ccc` rail/track and large teal handle, labeled marks (.5 / 1 / 1.5 / 2).
- **Modal (V1)** — full-window takeover, not a floating dialog: centered heading + labeled inputs + Cancel (outline) / Next (filled), `×` close top-right.
- **Inputs (V1)** — 1px light-gray border, ~4px radius, generous height (~56px), label above in body size.
- **Toasts** — react-toastify (imported globally).

## 5. Layout patterns

- **Airy, not dense.** Single content region per screen, huge whitespace, no sidebars, no chrome beyond the top nav.
- **Two nav levels:** home screens use logo-left + horizontal text tabs; inside an experiment the top bar becomes title-left + 4-step stepper + "Save Workspace" action right, with a secondary tab row beneath.
- **Content layouts:** full-width row list (My Experiments); 2-column card grid (Experiment Bank); three equal columns of heading + prose + control (V1 Edit Design / Protocol); split 40/60 diagram + traces (Collect); single centered column (modal forms).
- **Linear workflow** is the backbone: Edit Design → Collect → Clean → Analyze, always visible in the stepper.

## 6. Illustration style

- **Flat, two-tone gold** — solid `#ffc107`-family gold + a lighter tint, no gradients, no shadows.
- **Black line accents** — thin (~2–3px) black outlines and details (eyelashes, window panes, circle outlines) over the flat gold shapes; some shapes are outline-only with offset gold fill behind (the "T/L" visual-search tiles — a deliberate misregistered-print look).
- **Geometric/hand-cut feel** — simple shapes (diamonds, blobs, letterforms as art: "BLUE/RED" for Stroop).
- **Logo** — teal wordmark with a wavy EEG-trace cut through the letterforms.
- Illustrations are decorative identifiers for cards only — no illustrations inside workflow screens.

## 7. Empty / error / loading conventions

- **Empty states (V1):** placeholder gray rectangles above the heading + instructional prompt text in body style ("Enter your research question here.") — inviting fill-in-the-blank, not blank panels.
- **Signal states:** the four-color signal system with an always-visible dot legend ("Strong / Mediocre / Weak / No signal").
- **Loading:** `Spinner` primitive exists; no skeleton screens.
- **Errors:** react-toastify toasts; `destructive` button variant for dangerous actions — though the live Delete button renders as a *neutral* outline button, so destructive red is not consistently applied.
- **Help:** floating circular teal `?` button, bottom-right (V1 Collect).

## 8. Inconsistencies / drift

1. **Two button languages.** V1: outlined-teal for secondary, filled-teal for the one primary. Current shadcn set: gray `secondary`/`outline` variants — the teal-outline style survives nowhere in the primitives, yet dominates the V1 material and reads as the brand's signature. Live "Delete"/"Go to Folder" are neutral gray; V1 "Cancel" was teal-outlined.
2. **Two active-tab treatments.** V1: gold `border-b-4` underline (stepper + secondary tabs, still the current in-experiment pattern). Home nav in current screenshots: a *boxed outline* around the active tab instead — and the box color differs between the two screenshots (gold on My Experiments, darker on Experiment Bank).
3. **Two heading systems fighting.** `h1` 36px normal weight vs `h2` 36px bold — same size, opposite weights, both `!important`, coexisting with Tailwind `text-lg`/`text-2xl` utilities in components. The `!important`s are legacy CSS defending itself against the Tailwind reset.
4. **Three golds.** `accent #ffc107`, `signal-ok #ffcd39`, plus lighter illustration golds — adjacent but non-identical yellows with different jobs.
5. **Two teals.** `brand #007c70` vs `signal-great #66b0a9` (intentional per the signal system, but undocumented until now).
6. **Background is a per-screen hack.** `body` is `rgba(255,255,255,0.2)` and each main screen repaints `bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]` inline — the gradient is a repeated literal, not a token.
7. **px vs rem.** Global CSS speaks px with `!important`; components speak Tailwind rem. Same for letter-spacing (1.29px / 0.64px / `tracking-[0.5px]` / `-0.025em`).
8. **Global `button:active` scale** applies the 0.95 press effect to every button in the app, including third-party ones (rc-slider, toasts, lab.js/jsPsych experiment UIs).
9. **Modal drift.** V1 modals are full-window takeovers with a top-right `×`; the shadcn `Dialog` is a floating centered panel. Both patterns now exist.
10. **Destructive color unused where it matters.** Delete actions render as neutral buttons; `destructive` red exists in the primitive set but not in the flows shown.
11. **Two "weak signal" reds.** Tailwind `signal-bad` is `#e06766`, but the runtime `SIGNAL_QUALITY.BAD` enum (`src/renderer/constants/constants.ts`) paints `#ed5a5a` — the head map and the legend can disagree.
