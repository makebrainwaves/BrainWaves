# BrainWaves QA implementation plan

Source: November 17 QA review of `fix/per-session-cleaned-epochs` and the Stroop dataset in `~/BrainWaves_Workspaces/Stroop_Task/Data/dano`. Do not bundle every item as one visual redesign PR.

## Priority

1. **P0 — Stroop behavior data loss**
2. **P0 — Stroop misleading instruction copy**
3. **P1 — post-connection signal-quality screen**
4. **P1 — redundant Prepare/preview key reminders**
5. **P2 — Prepare typography reference alignment**
6. **P2 — pre-run “Ready to run” reference alignment**
7. **Investigation — Stroop EEG rereferencing** (no production change yet)

## 1. Stroop behavior CSV is present but not analyzable — P0

### Finding

`dano-test-1-behavior.csv` contains the main trial rows: **96 `Stroop screen` rows with `phase = task`**. The useful response is already there:

- `duration` = reaction time
- `correct` = lab.js correctness
- `congruent` = trial family
- `color`, `word`, `phase`, `sender_id`

The analyzer drops every row because `aggregateDataForPlot` / `filterData` requires `trial_number`, `reaction_time`, `correct_response`, and `response_given`; the CSV does not contain those fields.

### Root cause

`initStroopTrial` in `src/renderer/utils/labjs/functions.ts:227` starts with:

```ts
if (!this.options.id) return;
```

The adjacent `initResponseHandlers` already documents the bug: loop-cloned components have `this.id`, but not `this.options.id`. So Stroop’s custom data backfill returns immediately and never writes the fields the behavior analyzer requires.

The second-order problem is `initStroopTrial` is attached to the **Inter-trial interval** screen and computes:

```ts
this.data.reaction_time = this.state.duration;
```

On the ITI screen, `this.state.duration` is the inter-trial screen duration (~500–1000 ms), not the preceding stimulus response time. Writing these fields from the ITI screen would produce plausible-looking but wrong data.

### Fix — do not patch symptom by writing fields on ITI

Move response normalization to the stimulus screen itself, and stop after the stimulus screen.

Files:

- `src/renderer/experiments/stroop/experiment.ts`
- `src/renderer/utils/labjs/functions.ts`
- `src/renderer/utils/behavior/compute.js`
- `BrainWaves/tests` (existing behavior-compute coverage)

Implementation:

1. Add a small `initStroopResponse` hook attached to **both** Stroop stimulus screens (practice and main). It uses `this.id` for `trial_number`, reads the response at the stimulus screen, and writes:
   - `trial_number`
   - `response_given`
   - `response`
   - `reaction_time` from that screen’s elapsed timer
   - `correct_response` from `this.state.response === this.parameters.color`
   - `condition` from `congruent` (`Match`/`Mismatch`)
2. Remove `initStroopTrial` from both ITI screens; the hook should no longer exist there.
3. Keep `emitStroopCondition` as marker output; do not conflate marker emission with behavior-row normalization.
4. Keep `data.correct = 'empty'` on fixation as the reset that lets `response_given` be scored from the stimulus state.

### Preserve the existing dataset — do not discard it

The collected CSV already contains the canonical values. Add a pure legacy-row normalizer at the behavior read boundary:

- Legacy Stroop `Stroop screen` rows are identified by `sender === 'Stroop screen'` and the presence of `congruent`.
- `reaction_time` ← `duration`
- `correct_response` ← `correct`
- `response_given` ← `correct === 'empty' ? 'no' : 'yes'` where available; otherwise the presence of `response`
- `condition` ← `congruent === 'yes' ? 'Match' : 'Mismatch'` (keep raw `congruent` too if the plot contract allows condition labels)
- `trial_number` ← parse the next-to-last component of `sender_id`
- Ignore `phase === 'practice'`

This is persisted-data compatibility, not a compatibility shim for code behavior: users have real CSVs, and deleting their analysis capability is not acceptable.

### Acceptance checks

1. Feed `~/BrainWaves_Workspaces/Stroop_Task/Data/dano/Behavior/dano-test-1-behavior.csv` into `aggregateDataForPlot`; `Response Time`, `Accuracy`, Bars/Dots/Box all render rows for the two Stroop conditions.
2. Unit test proves `aggregateDataForPlot` consumes a synthetic lab.js Stroop CSV without `trial_number`/`reaction_time`.
3. Fresh Stroop run writes the same normalized fields directly; no ITI-derived reaction times.
4. Analyze → Behavior on the existing workspace shows a plot without touching the raw CSV.
5. Re-run behavior tests; add one fixture row from the real CSV shape rather than only idealized rows.

## 2. Stroop helper text — P0, one-line copy fix

File: `src/renderer/experiments/stroop/screens.ts`.

Current:

```ts
detail: `The word says “green”. Press ${keycap('r')}`,
```

Change to:

```ts
detail: `The ink is red. Press ${keycap('r')}`,
```

and the matching second example:

```ts
detail: `The ink is blue. Press ${keycap('b')}`,
```

Optional safety improvement: style the word using the same experiment color mapping as the task (`red`, `blue`, `green`, `#ffe32a`) so the printed example never drifts from the condition key.

Test: extend `experiments/__tests__/participantScreens.test.ts` to assert the detail line names the ink, not the literal word.

## 3. Post-connection “Get a clear signal” — P1 investigation, then redesign

Files:

- `src/renderer/components/HeadsetSetup/SignalPrep.tsx`
- `src/renderer/components/HeadsetSetup/LiveSignalPrep.tsx`
- Callers: `CollectComponent/index.tsx`, `EEGExplorationComponent.tsx`
- Stories: `HeadsetSetup.stories.tsx` (`SignalPrep`, `SignalPrepCrown`)

Problem: the current screen is three text-heavy sections plus a full sensor card list. It presents the entire lesson before the user has a live signal to compare it against.

Direction:

1. First pass should show the head map and per-channel live quality immediately; text becomes a short checklist, not three numbered lessons.
2. Replace each free-text sensor card with a compact row: channel, location, quality word, dot, and one fix only when quality is not good.
3. Keep the useful settling behavior. Do **not** hard-gate the user. Suggested behavior: enable “Continue” only after the first live quality sample arrives, then keep it enabled with a “signal still settling” note. This preserves the pause without turning it into an intimidating wall of text.
4. Keep the quality labels and fixes in `constants/electrodes`; do not fork the vocabulary in the new layout.
5. Verify on Muse 4-channel and Neurosity 8-channel story states.

Acceptance: at screen height 768, the user sees head map, all four Muse channels, and the continue action without scrolling.

## 4. Remove redundant Prepare/preview key reminders — P1

File: `src/renderer/components/PrepareSteps/PrepareSteps.tsx`.

Current duplicates:

- `ResponseDiagram` already shows stimulus → response in Protocol.
- `KeyLegend` repeats the same key mapping below the stopped-preview intro.
- `PreviewRunningView` repeats it again beneath the live preview.

Change:

- Remove `KeyLegend` from `PreviewRunningView`; the preview is the mapping.
- Remove `KeyLegend` from the stopped-preview intro; `ResponseDiagram` already covered it in Protocol.
- Keep `ResponseDiagram` because it explains the full flow before preview.
- After deletion, remove `KeyLegend` if no caller remains.

Acceptance: preview-running view has no repeated key row; the screenshot/story test still confirms the participant screen fits without extra vertical content.

## 5. Prepare typography — P2, use the supplied reference

Files:

- `src/renderer/app.global.css` (`h1`, `h2`, `p`, `.experiment-design-copy`, `.experiment-design-card-copy`)
- `src/renderer/components/PrepareSteps/PrepareSteps.tsx`
- `src/renderer/components/PrepareSteps/PrepareSteps.stories.tsx`

Do not redesign from scratch: the QA owner has a design reference.

Guardrails:

- Do not change global `p`, `h1`, or `h2` for this task. Scope any reference alignment to Prepare: `.experiment-design-content` and its copy classes.
- Keep the single 800 px reading column.
- Preserve `text-wrap: pretty` for headings.
- Keep the existing screenshot/story overflow assertion.

Suggested contract after reference review:

- body copy around 18–19 px
- line-height around 1.55–1.65, not 1.8
- restrained letter spacing (near normal)
- card copy around 16–17 px
- consistent heading scale and card rhythm

Acceptance: the reference matches visually, and the participant/prepare screenshot stories do not overflow.

## 6. Pre-run “Ready to run” — P2, use the supplied reference

File: `src/renderer/components/CollectComponent/RunComponent.tsx`.

Current issues: title card, participant metadata, pacing, signal-quality head, and primary action compete at several alignments.

Guardrails:

- Preserve `handleStartExperiment` unchanged.
- Preserve duplicate-session and no-EEG warning behavior.
- Preserve keyboard gate: Run button → armed state → Space begins → Escape backs out.
- Preserve no-workspace and missing-subject disabled states.

Direction: apply the supplied reference rather than inventing a third design language. Likely simplification:

1. One centered panel, one visual hierarchy.
2. Participant/group/session as compact chips, with a small edit action.
3. Pacing/stillness as one short note.
4. Signal quality as the only live visualization; collapse or move instructional copy behind it.
5. One primary action at the bottom.

Acceptance: no functional behavior changes; visual tests and manual click-through prove the Run → armed → Space flow is unchanged.

## 7. Stroop rereferencing investigation — evidence, not product change

Probe run against `dano-test-1-cleaned-epo.fif`:

- Events: `Incongruent` = 41 epochs, `Congruent` = 46 epochs.
- Derived reference: each frontal channel minus average(TP9, TP10).
- Artifact generated during investigation: `/tmp/stroop-reref-AF7.png`, `/tmp/stroop-reref-AF8.png`.

Observed mean Incongruent − Congruent differences (µV):

| Channel | Window | Current implicit reference | AF − avg(TP9, TP10) |
|---|---:|---:|---:|
| AF7 | 150–250 ms | +0.62 | −0.69 |
| AF7 | 250–350 ms | −0.42 | −0.01 |
| AF7 | 350–500 ms | −0.20 | −0.57 |
| AF8 | 150–250 ms | +1.04 | −0.27 |
| AF8 | 250–350 ms | −0.51 | −0.10 |
| AF8 | 350–500 ms | −0.17 | −0.54 |

Interpretation: rereferencing changes the sign and shape, but this single run does **not** produce a convincing clean N200/N450 difference. It may amplify reference-site activity instead of isolating the Stroop effect. Do not expose a rereferenced mode in Analyze yet.

Next experiment, if pursued:

1. Collect at least three short runs.
2. Test: current implicit reference, AF − avg(TP9, TP10), AF − TP9, and AF − TP10.
3. Report per-window confidence intervals and keep trial counts identical.
4. Decide from morphology and uncertainty, not from a prettier plot.

## Suggested engineering sequence

1. Stroop behavior normalization + regression test.
2. Stroop copy fix.
3. Signal-quality redesign.
4. Remove duplicated key legends.
5. Apply Prepare and pre-run supplied references.
6. Optional rereferencing study after more data.

## Verification bundle

- `npx vitest run` relevant behavior, participant-screen, Prepare, Collect, and HeadsetSetup tests.
- `npm run typecheck`
- `npm test`
- `npm run dev:playtest`
- Storybook/Chromatic states for Prepare, HeadsetSetup/SignalPrep, and Collect Ready-to-run.
- Manual: open the current Stroop workspace and verify Behavior renders; run one short fresh Stroop session and verify the same behavior without the legacy normalizer.
