# WS5 design brief — participant screens and run outcomes

**Gate:** plan §10.1 step 2. Storybook stories with fixture data only, no runtime wiring. Engineering integrates after product approves the stories.

**Sources:**
- `docs/uxr/playtest_naive_1_design_implementation_plan.md` §1.2, §1.5, §7, §10.2, §11 WS5.
- Engineering plan `docs/superpowers/plans/2026-09-23-ws5-early-exit-incomplete-runs.md`: early-exit behavior is already decided; do not redesign it.
- Design system: `docs/design/DESIGN.md`, `.design-sync/conventions.md`.
- Previous pass to match in shape: PR #272 (`src/renderer/components/HeadsetSetup/`).

## The job

A student runs a classmate through an experiment. The participant has to know three things:
- which keys to press, and what each one means;
- whether they are practicing or being recorded for real;
- when to start.

The student running it must always be able to tell whether the run finished or ended early. Playtest 1 found repeated typos ("Press the the space bar") and small, unscannable text. It also found no mapping reminder before the recorded task, and a "Recording complete" message even after an early exit.

## A. Participant screens (lab.js HTML, BrainWaves-owned only)

These render inside lab.js, fullscreen, during recording. There is no app chrome inside them; the RunBar sits above.

| Story | Content |
|---|---|
| Instructions — before practice | Experiment title. One short "what you'll do" paragraph. Response mapping as keycaps (key → meaning). Pacing line from the protocol. EEG stillness line only when EEG is on. `Press Space to start practice` in a fixed, predictable spot. `Q` to skip practice as a quiet secondary. |
| Practice → main transition | Practice is over. The same mapping again (§7.2: "before practice and again before the recorded task"). `The real trials start now`. Space to begin. |
| End | Thank-you plus `Press Space to finish`. |

**Fixtures, one story per experiment for the Instructions screen.** Use the real keys and copy from each `src/renderer/experiments/<name>/content_protocol.js` and `params.ts`:
- **Faces/Houses:** `1` = face, `9` = house. Pacing: "This isn't a speed test…"
- **Stroop:** `r` / `g` / `b` / `y` = the ink color (check the Stroop instruction screen in `stroop/experiment.ts`).
- **Visual Search:** `b` = orange T present, `n` = absent. Pacing: "Speed counts here…"
- **Multitasking:** intro screen only. Its block, Ready and countdown screens are lab.js canvas screens and out of scope.
- **Custom:** condition titles plus their keys, including a condition with no key.

Transition and End need only one fixture each, plus an EEG-off variant of Instructions.

**Technical form.** This is what makes the approved design integrable without a rewrite:
- Screen builders live in `src/renderer/experiments/shared/participantScreens.ts`. Each is a function that takes typed fixture-shaped params and returns a lab.js `content` template string. Lab.js content is a lodash template, so `${this.parameters.x}` is allowed. In TS template literals, escape it as `\${` (see `.llms/learnings.md`).
- Styling is one scoped class (e.g. `.bw-participant`) added to `src/renderer/app.global.css`:
  - Do not un-layer lab.css. Do not use `!important` hacks beyond what exists.
  - Traps in `.llms/learnings.md`: lab.css styles bare `header/main/footer` (24px padding, centered); the global `li { list-style: none }` reset; the global `p { font-size: 18px !important }`.
- Stories render the builder output the way lab.js does. Evaluate it with lodash `template(raw, { escape: '', evaluate: '' }).call(ctx, ctx)`, where `ctx = { parameters, state: {}, files: {} }`, and inject it into `<div class="container fullscreen" data-labjs-section="main">`. That is the real lab.js mount (`LabjsExperimentWindow.tsx`).
- Do not edit any `experiments/*/experiment.ts`. Swapping the old screens for the builders is engineering's integration step.

## B. Collect run states (React)

A pure-props `RunResult` component in `src/renderer/components/CollectComponent/RunResult.tsx`, with stories:

| Story | Required |
|---|---|
| CompleteEEG | Primary `Clean this recording →`, secondary `Run another participant` (§1.2) |
| CompleteBehaviorOnly | Primary `Analyze results →`, secondary `Run another participant` |
| EndedEarly | Heading exactly `Experiment ended early`, never "Recording complete" (§1.5). Says what was recorded is kept but marked incomplete and won't appear in Clean or Analyze. One action: `Run again`. No confirm, no Resume. |
| Finalizing | `Saving what was recorded…` shown between an early exit and the result |

Suggested props:
- `outcome: 'complete' | 'incomplete' | 'saving'`
- `modality: 'eeg' | 'behavior'`
- `subject: string`
- callbacks for each action; navigation stays with the caller, so no router inside.

**RunBar hold-Escape feedback.** Add one optional prop to `src/renderer/components/AppShell/RunBar.tsx` (e.g. `escapeHeld?: boolean`) and a `HoldingEscape` story in `AppShell.stories.tsx`. It shows that holding Esc ends the run early. A 1-second hold with no feedback is invisible. Do not change the existing RunBar states.

## Constraints (non-negotiable)

- Keycaps are recognizable `<kbd>` shapes, never color-only.
- No animation or large movement on any participant screen.
- Pacing comes from each protocol. Never write a global "speed doesn't matter" (§7.4).
- The stillness line appears only when EEG is on: "Remain still and avoid talking while trials are running."
- Teal = action, gold = location. One filled-teal primary per surface. Headings are light-weight.
- Student-facing, friendly, direct tone. Fix every "the the".
- Imported jsPsych / lab.js studies are untouched (§7.1).
- Electron window minimum width is 1180px, and the root font-size is 18px (learnings). Size participant text for being read from a chair, not a laptop lean-in.

## Out of scope

- Canvas screens: fixation, stimuli, feedback, Multitasking block/countdown.
- An in-experiment progress bar: the RunBar already shows progress (#270).
- Reveal/delete incomplete recordings (WS6).
- Any runtime or Redux wiring.

## Done when

- Every story above renders in Storybook. Check each visually with a screenshot; do not just typecheck.
- `npx tsc --noEmit` is clean.
- A PR lists the review agenda: story names, open copy questions, and any constraint you could not meet.
