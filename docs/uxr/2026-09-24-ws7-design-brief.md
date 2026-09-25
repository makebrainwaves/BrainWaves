# WS7 design brief — Analyze

**Gate:** plan §10.1 step 2. Storybook stories with fixture data only, no runtime wiring. Engineering integrates after product approves.

**Sources:**
- `docs/uxr/playtest_naive_1_design_implementation_plan.md` §1.3, §8.4, §9, §10.2 ("Analyze"), §11 WS7.
- Playtest 1 P0 in `TODOS.md`: "Analyze: layout broken by recent component changes; stray elements popping up."
- Design system: `docs/design/DESIGN.md`, `.design-sync/conventions.md`.
- Shape to match: #272 (`components/HeadsetSetup/`) and #273 (`CollectComponent/RunResult.tsx`). Pure-props views, co-located stories, fixtures file.

## The job

After collecting (and for EEG, cleaning), the student wants to answer their research question. Today Analyze reads as a gallery of plots. Redesign Overview / ERP / Behavior around the student's questions (§9.1). Do **not** invent analysis behavior or change any calculation (§9.2).

## Current code (read before designing)

- `src/renderer/components/AnalyzeComponent.tsx` (~600 lines). `ANALYZE_STEPS` OVERVIEW / ERP / BEHAVIOR (behavior-only: BEHAVIOR only). Props: `epochsInfo`, `channelInfo`, `psdPlot`, `topoPlot`, `erpPlot` (Pyodide SVG results keyed as today), `isEEGEnabled`, `type`, `deviceType`.
- `src/renderer/components/PyodidePlotWidget.tsx` — how Pyodide SVG/PNG plots render.
- `src/renderer/components/svgs/ClickableHeadDiagramSVG.tsx` — channel selection by head diagram.
- `src/renderer/utils/behavior/compute.js` — behavior aggregation (response time / accuracy, outlier removal, plot types). Behavior values are strings after the CSV round-trip (`.llms/learnings.md`).
- `src/renderer/utils/eeg/conditionPalette.ts` — stable condition colors.
- `src/renderer/components/AppShell/WorkspaceAreaGate` — the existing whole-area blocked state (#269). Analyze must not be wholly gated when behavior data exists (§13).

## Stories required (plan §9.2, §10.2 "Analyze")

Split the screen into focused presentational components only where Storybook needs it (§11 WS7). E.g. `components/Analyze/{AnalyzeOverview,AnalyzeErp,AnalyzeBehavior}.tsx`, with a fixtures file whose shapes match the current props and Pyodide result shapes. For plots, use a captured or representative SVG string fixture; do not add a plotting library (§13).

| Story | Must show |
|---|---|
| NoData | Explains what to do next with one action (`Go to Collect`). |
| BehaviorBeforeCleaning | EEG workspace with complete behavior but no cleaned EEG. Behavior fully usable. Overview/ERP show the clean-data-required state with one `Go to Clean`. |
| OverviewResults | Select one or more cleaned datasets; which subjects/recordings are included; dataset summary, PSD, topography. |
| OverviewLoading / OverviewError | Explicit loading and analysis-error states. |
| ErpExplainer + ErpResults | What an ERP represents, in plain language. Channel selection via the head diagram **and** a channel list. Conditions distinguished by stable labels and colors (never color alone). |
| ErpNoResult / ErpLoading / ErpError | Each state explicit. |
| BehaviorResults | Choose response time or accuracy; outlier removal, data-point display, plot type; what each visualization communicates. |
| BehaviorExport | Export aggregated data with visible success and failure feedback. |
| BehaviorOnlyWorkspace | Behavior-only workspace: no Overview/ERP tabs, no Clean references. |

## Constraints

- Keep the existing Overview / ERP / Behavior division as the starting point (§9.1).
- Analyze is available when any analysis has valid input. Prerequisites are enforced per section, never as a whole-page gate when behavior exists (§8.4, §13).
- Incomplete (ended-early) recordings never appear as selectable datasets (§1.5). Engineering gets this for free from the `*.incomplete.csv` naming in #275, so no story needs to show them.
- Condition colors come from `conditionPalette`; signal-quality colors are never reused for conditions (DESIGN.md).
- One filled-teal primary action per surface. Light headings. Student-facing tone.
- Root font-size is 18px and the window min width is 1180px (`.llms/learnings.md`). Render inside the real AppShell chrome (as #273's decorator does) and check 1366×768 and 1280×720.
- The "stray elements" P0: while reading `AnalyzeComponent.tsx`, list what causes it (e.g. leftover `HelpButton`/sidebar pieces, lab.css `main/header` leaks) in the PR so engineering fixes it in integration. Do not edit `AnalyzeComponent.tsx`.
- New files + stories only (plus scoped CSS in `app.global.css` if needed). No Redux, epic, Pyodide or worker changes.

## Out of scope

Wiring, statistics beyond what exists, V3 AI analysis, the Clean screen.

## Done when

- Every story renders in Storybook inside the real shell chrome, screenshotted at both sizes, with no console errors.
- `npx tsc --noEmit` clean.
- A PR with a review agenda, open questions, the stray-elements diagnosis, and any unmet constraint.
