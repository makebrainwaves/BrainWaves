# WS4 design brief — Prepare, local steps, protocol, Preview

**Gate:** plan §10.1 step 2. Storybook stories with fixture data only, no runtime wiring. Engineering integrates after product approves.

**Sources:**
- `docs/uxr/playtest_naive_1_design_implementation_plan.md` §1.1, §1.4, §3.2, §3.3, §6, §10.2 ("Experiment Prepare"), §11 WS4.
- Design system: `docs/design/DESIGN.md`, `.design-sync/conventions.md`.
- Shape to match: #272 (`components/HeadsetSetup/`) and #273 (`components/ParticipantScreens/`, `CollectComponent/RunResult.tsx`). Pure-props views, co-located stories, fixtures file.

## The job

Prepare is where a student learns what the experiment is before collecting data. Both playtests (09-18 naive; 09-23 product) found that the global workflow bar (Prepare / Collect / Clean / Analyze) and the local step bar (Overview / Background / Protocol / Preview) read as one stacked nav. The student can't tell "where am I in the study" from "where am I in this lesson". Each step also lacks a clear forward action.

## Current code (read before designing)

- `src/renderer/components/DesignComponent/index.tsx` — built-in Prepare. `DESIGN_STEPS` OVERVIEW / BACKGROUND / PROTOCOL / PREVIEW, rendered through `SecondaryNavComponent`.
- `src/renderer/components/SecondaryNavComponent/` — the local tab bar (+ existing `SecondaryNavSegment.stories.tsx`).
- `src/renderer/components/AppShell/` — the global bar (WorkflowNav, gold current / quiet `Next →`). Do not change it; design the local steps to be visibly different from it.
- `src/renderer/experiments/<name>/content_overview.js`, `content_background.js`, `content_protocol.js` — the real copy and protocol fields (`condition_*`, `*_key`, `pacing`). Take fixtures from these for Faces/Houses and at least one other built-in.
- `src/renderer/components/PreviewExperimentComponent.tsx` + the Design screen's preview state — the existing `PREVIEW · nothing is being recorded` + `Stop preview` + `Run & record` behavior shipped in #270. Keep those semantics.
- Custom (`CustomDesignComponent.tsx`) and imported (`ImportedDesignComponent.tsx`) Prepare surfaces use Design / Configure instead of Learn. Show how the local-step pattern applies to them in at least one story each. Do not redesign their forms.

## Stories required (plan §10.2 "Experiment Prepare")

Use a new pure-props component, e.g. `components/PrepareSteps/`, with a fixtures file and stories:

| Story | Must show |
|---|---|
| Overview | Local stepper clearly subordinate to the global bar (render inside the real `AppShell` chrome, as #273's decorator does). Title, what the study asks, one dominant forward action `Next: Background`. |
| Background | Readable lesson copy. `Back` + `Next: Protocol`. |
| Protocol | The existing condition cards and keycaps (reuse the #273 keycap look), **plus** a compact flow infographic generated from parameters: Faces/Houses = Instructions → 6 practice trials → Main-task reminder → 120 recorded trials → Completion (§6.2). Pacing line from the protocol. Graphics clearly explanatory, not interactive. Forward action `Try the experiment`. |
| PreviewStopped | Preview entry: expected keys, "nothing is recorded", primary `Try the experiment`, and `Run & record` reachable. |
| PreviewRunning | Persistent `PREVIEW` chrome, "nothing is being recorded", expected keys, visible `Stop preview` (§3.3). Placeholder for the experiment area. |
| PreviewFinished | `Run & record` is the dominant next action; `Preview again` secondary. |
| DirectCollect | A student who skips the lessons can still go to Collect. No lock, no completion checkmark, no "you must finish" copy (§1.4, §13). |
| CustomDesign / ImportedConfigure | The same local-step treatment with the local heading Design / Configure; forms shown as placeholders. |
| OliverSacksFallback | Background section with a local illustrated explanation + transcript-length text in place of the YouTube embed (§6.3: no remote player; rights not confirmed). Mark the illustration spot clearly as a placeholder if no art exists. |

Build the flow infographic from a typed input (e.g. `{ label, count? }[]`) derived from params in fixtures, not hand-drawn per experiment.

## Constraints

- Global bar = gold for location, teal `Next →` for recommendation (WS1). The local stepper must not reuse the gold underline in a way that reads as a second global nav. Pick a visibly different treatment and explain it in the PR.
- One filled-teal primary action per surface. Action labels name the consequence (§1.2).
- No persisted lesson/preview completion; no gating of Collect (§1.4, §13).
- Student-facing, friendly, direct tone. Light headings.
- Root font-size is 18px and the window min width is 1180px (`.llms/learnings.md`). Check 1366×768 and 1280×720 inside the real shell chrome.
- Traps in `.llms/learnings.md`: lab.css styles bare `<main>/<header>`; global `li { list-style: none }`; global `p { 18px !important }`; `.experiment-design-content` resets already exist for the Design screen.
- Do not edit `DesignComponent/index.tsx`, `SecondaryNavComponent`, the AppShell, or any experiment/runtime file. New files + stories only (plus scoped CSS in `app.global.css` if needed).

## Out of scope

Wiring into Redux/routes, the Custom/Imported form contents, real Oliver Sacks media, Collect/Clean/Analyze.

## Done when

- Every story renders in Storybook inside the real shell chrome; each is screenshotted at both sizes.
- `npx tsc --noEmit` clean.
- A PR with a review agenda, open copy questions, and any unmet constraint.
