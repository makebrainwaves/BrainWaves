# WS3 design brief — Explore EEG

**Gate:** plan §10.1 step 2. Storybook stories with fixture data only, no runtime wiring. Engineering integrates after product approves.

**Sources:**
- `docs/uxr/playtest_naive_1_design_implementation_plan.md` §5, §10.2 ("Explore EEG"), §11 WS3.
- `docs/uxr/playtest_naive_1.md` findings 3 and 4.
- `docs/uxr/# Playtest Takeaways.md`, the "Live EEG Viewing" section.
- Design system: `docs/design/DESIGN.md`, `.design-sync/conventions.md`.
- Shape to match, all merged: #272 HeadsetSetup/SignalPrep, #273 ParticipantScreens, #277 Analyze (left controls rail + results, and the ERP walkthrough's Back/Next step panel). Build on #277's rail and walkthrough patterns, so the app has one lesson idiom.

## The job

A student puts on a headset, sees their own brain signal live, and learns three things without a facilitator:
- whether the signal is usable;
- what "noise" means (not sound);
- that they can cause visible changes: a blink artifact, and alpha with eyes closed.

In the playtest this was the most engaging moment: the blink made the plot jump. It was also the most facilitator-dependent. Instructions sat too low, "noise" was misread, the eyes-closed activity had no clear start, countdown or chime meaning, and the alpha effect was subtle and unexplained.

## Current code (read before designing)

- `src/renderer/components/EEGExplorationComponent.tsx`:
  - The disconnected landing: image, "Explore Raw EEG", "Connect a headset".
  - `ConnectedExplore`: plot, sensor card and lesson picker.
  - The disconnected landing is the "blank screen" product flagged; redesign it.
- `src/renderer/components/ExploreLessonFlow.tsx`: the lesson runner (steps, Back/Next/Exit, blink detector, eyes-closed interval, alpha comparison).
- `src/renderer/constants/exploreLessons.ts`: the two lessons and their step copy: `clean-signal` "How do I get a cleaner signal?" and `noise-sources` "Where is this noise coming from?".
- `src/renderer/components/ExploreSensorCard.tsx`, `SignalQualityIndicatorComponent.tsx`, `constants/electrodes.ts` (`QUALITY_LABELS`, `ELECTRODES`).
- `src/renderer/utils/eeg/exploreSignal.ts` (blink detection, alpha ratio) and `lessonAudio.ts` (chimes).
- `src/renderer/components/HeadsetSetup/SignalPrep.tsx` (#274): signal prep after pairing. It now shows on Explore before the connected view. Don't duplicate its checklist; the lessons follow it.
- **The live plot is a `<webview>` (`ViewerComponent`, d3 `EEGViewer`) and cannot run in Storybook.** Draw a fixture stand-in with React SVG: a few seconds of multi-channel trace from a synthetic series, with blink spikes and an eyes-closed alpha burst where a step needs them. Keep its geometry close to the real viewer's (channels stacked, time running left to right, labels on the left) so integration swaps in the webview.

## Stories required (plan §5, §10.2)

Pure-props components under `src/renderer/components/Explore/`, with a fixtures file and stories. Render inside the real AppShell chrome with no workspace (Explore is workspace-free), as #273/#277's decorators do.

| Story | Must show |
|---|---|
| Disconnected | Redesigned landing. What Explore is, one primary `Connect a headset`, what you'll do once connected. Pairs visually with the Home Explore card. No "Live view only" chip (product removed it). |
| Waiting | Connected, no data yet: an explicit waiting state. |
| QualitySummary: Ready / Settling / AdjustSensors / NoSignal | Overall status above the plot (§5.1): `Ready to explore`, `Sensors are still settling`, `Adjust AF7 and TP10`, `No signal detected`. It names an action where one exists. Color supports; words explain. Per-sensor detail stays available without reading color. |
| NoiseDefinition | The plain-language definition of noise (§5.1 wording), shown before the student judges anything. Contact can improve over several minutes; never promise a fixed warm-up. |
| LessonPicker | The two lessons as clear, local choices, with no competing global nav. |
| Blink steps 1–4 | The sequence in §5.3: (1) blink once and find the marked response; (2) predict what another blink will do; (3) blink several times so it's unmistakable; (4) compare a blinking interval with a quiet one. The instruction sits above or beside the plot (§5.2), with Back/Next/Exit local to the lesson. Also a **BlinkNotDetected** state: the lesson continues gracefully if detection fails or the frontal sensors haven't settled. |
| NoiseLessonStableColors | During the noise-source demonstration, traces use stable colors (not signal-quality colors) so they don't compete (§5.2). |
| EyesClosed steps | The single guided sequence in §5.4: explain the start and end sounds → `Begin eyes-closed activity` → visible 3–2–1 countdown → `Close your eyes` → the interval (works without watching the screen) → unmistakable `Open your eyes` → review the marked interval plus the measured 8–12 Hz comparison. |
| AlphaResult / AlphaNoEffect | The student's real alpha comparison as the result. An optional ideal reference, labelled `Example`, visually separated, never implying everyone shows it. For Muse, describe TP9/TP10 as the available posterior-side proxy. NoEffect is a valid, encouraging outcome, not a failure. |
| StreamError | Error and unsupported-channel states that say what to do. |

## Constraints

- Explore never creates a workspace or records anything (§2.2, §13).
- No fake participant data presented as real (§13). Stand-in plots are fixtures; any reference curve is labelled `Example` in the UI.
- One filled-teal primary action per surface. Teal = action, gold = location. Signal colors only for signal status. Never color-only.
- Student-facing, friendly, direct copy. Light headings.
- No animation beyond what a step needs, and none during stimulus-like moments. The countdown may animate and must respect `prefers-reduced-motion`.
- Rule A (from #277): at 1366×768 and 1280×720, the plot, the current instruction and its lesson controls are all visible with no page scroll. Measure and report it.
- Traps in `.llms/learnings.md`: 18px root font-size; global `p { 18px !important }`; `li { list-style: none }`; lab.css `main/header`.
- New files + stories only. Scoped CSS classes are fine, but never modify existing shared global CSS classes. No new dependencies (package.json untouched). Don't edit EEGExplorationComponent, ExploreLessonFlow, ViewerComponent, EEGViewer.js, the constants or utils; read them for real copy, thresholds and step structure.

## Out of scope

Wiring, the webview itself, changes to detection math, the Collect-side signal checks.

## Done when

- Every story renders in Storybook inside the real shell chrome, is screenshotted at both sizes, and has 0 console errors.
- `npx tsc --noEmit` is clean.
- A PR with the review agenda, open copy questions, how the fixture plot maps to the real viewer, and any unmet constraint.
