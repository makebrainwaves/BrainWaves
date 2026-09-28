# WS6 design brief — Clean

**Gate:** plan §10.1 step 2. Storybook stories with fixture data only, no runtime wiring. Engineering integrates after product approves.

**Sources:**
- `docs/uxr/playtest_naive_1_design_implementation_plan.md` §1.5, §8, §10.2 ("Clean"), §11 WS6.
- `docs/uxr/playtest_naive_1.md` finding 7.
- `docs/uxr/# Playtest Takeaways.md`, the "Cleaning Data" section.
- Design system: `docs/design/DESIGN.md`, `.design-sync/conventions.md`.
- Shape to match, merged: **#277 Analyze**. Use its left controls rail + results layout, its walkthrough step panel and its "no scrolling to reach results" rule, so Clean and Analyze read as one family.

## The job

A student has raw EEG recordings and must decide which trials and sensors are too noisy to keep before averaging. The real job (§8.2):
1. click a noisy epoch to exclude or restore it;
2. click a channel when one sensor is consistently bad;
3. treat auto-flags as suggestions to review;
4. watch the Live ERP update as exclusions change;
5. save the cleaned dataset and continue.

The playtester didn't know what cleaning meant, when it comes before analysis, or what her job was on the screen. #271 added a primer and clearer action names; the layout itself was never redesigned.

## Current code (read before designing)

- `src/renderer/components/CleanComponent/index.tsx`: the screen. It has a dataset-select phase and a review phase, the #271 primer ("What does cleaning your data mean?"), and the actions `Start cleaning →`, `← Pick different data`, `Apply exclusions & save`, `Save cleaned dataset & analyze →`, plus confirmations for rejecting all, removing selected, and dropping multiple channels.
- `src/renderer/components/CleanComponent/EpochReviewer.tsx`: the canvas epoch reviewer (columns = epochs, click to exclude; channel labels click to flag).
- `src/renderer/components/CleanComponent/LiveErpPane.tsx`: the live ERP.
- `src/renderer/components/CleanComponent/epochArrays.ts`: decoding and `meanTrace`. Its data is `EpochArraysMeta` (`src/renderer/actions/pyodideActions.ts`) plus a Float32Array [epoch][channel][time].
- `src/renderer/components/Analyze/fixtures.ts`: `EXAMPLE_EPOCH_ARRAYS` already exists in that shape. Reuse or extend it, and don't make a second synthetic generator.
- Auto-flag suggestions: `SuggestedRejection { index, reason }`, with the threshold `<input>` in CleanComponent.
- Incomplete runs (#275): ended-early recordings are renamed `*.incomplete.csv` and hidden from ordinary discovery.
- **Try to render the real `EpochReviewer` and `LiveErpPane` with fixture props in Storybook.** If they need Redux or the worker, wrap them in a thin fixture adapter inside the stories. Don't edit them. If they can't render at all, draw faithful stand-ins and say so in the PR.

## Stories required (plan §8, §10.2)

Pure-props components under `src/renderer/components/Clean/`, with fixtures and stories, rendered inside the real AppShell chrome (`location='clean'`, a workspace, truthful badges and Next).

| Story | Must show |
|---|---|
| DatasetSelect | Choose a complete raw recording. Ordinary list only; one primary `Start cleaning`. |
| DatasetSelectWithIncomplete | Incomplete recordings hidden by default, with a quiet "N ended-early recordings hidden — show" reveal. Revealed, they're clearly marked incomplete and not selectable as cleaning candidates, with a destructive-styled, confirmed `Delete` (§1.5, §11 WS6). |
| Loading | Loading epochs, explicit. |
| NoEpochs | The recording produced no usable epochs: why, and what to do. |
| Primer (first view of review) | A compact, always-available primer teaching the loop in §8.2, using the §8.1 definition. It collapses once the student interacts. No persisted first-use flag (§13). Consider #277's step-panel idiom with pointers at the reviewer. |
| Review | The Epoch Reviewer and Live ERP visible together as a coordinated pair (§8.3), plus the controls rail (dataset, back to selection, auto-flag threshold, exclusions summary). Rule A: everything on screen at once. |
| ReviewWithSelections | Several epochs excluded and one channel flagged, with the Live ERP visibly changed and the counts in words. |
| AutoFlagSuggestions | Suggestions shown as suggestions (distinct from the student's own exclusions), with review, accept and restore. |
| ConfirmRejectAll / ConfirmDropChannels | The existing confirmations, restyled (§8.3 keeps them). |
| Saving / SaveFailed / Saved | Save in progress, failure with retry, and success pointing to `Analyze` as the next step. |
| BehaviorOnly note | Not a story: behavior-only workspaces have no Clean area (WS1). Confirm this in the PR; don't design one. |

## Constraints

- Keep the epoch and channel selection behavior, save semantics and confirmations. Rename actions to describe their effect (§8.3).
- The route back to dataset selection stays (§8.3).
- The stale cleaning sidebar is gone (#271). Don't bring back saline or live-signal lessons (§8.3).
- The original recording is never modified, and the copy says so (§8.1).
- Condition colors come from `conditionPalette`. Signal-quality colors are not used for exclusions. Never color-only.
- One filled-teal primary per surface. Light headings. Student-facing copy.
- Rule A: at 1366×768 and 1280×720, the reviewer, the Live ERP and the controls are all visible with no page scroll. Measure and report.
- Traps in `.llms/learnings.md` (18px root, global `p`/`li`/lab.css).
- New files + stories only. Scoped CSS is fine; never modify shared global CSS classes. No new dependencies. Don't edit CleanComponent/*, epics, the worker or Python.

## Out of scope

Wiring, auto-flag algorithm changes, the Epoch reviewer Phase 3 guided mode's full curriculum (TODOS; OQ3 still open), Analyze.

## Done when

- Every story renders inside the real shell chrome, is screenshotted at both sizes, and has 0 console errors.
- `npx tsc --noEmit` is clean.
- A PR with the review agenda, open questions, whether the real EpochReviewer/LiveErpPane rendered, and any unmet constraint.
