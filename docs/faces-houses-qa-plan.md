# Faces/Houses flow — QA walkthrough plan

Running plan assembled during a live QA walkthrough of the Faces/Houses experiment
flow (Dano driving, 2026-07-15). **This is a backlog, not applied work** — a future
session implements these. Each item: what Dano observed → where it lives in code →
proposed fix shape. Grounding is pre-work so the implementing session starts warm.

Ties into TODOS.md **"Full experiment-flow QA pass"** (Now / Summer 2026).

---

## Locked decisions & sequencing (`/plan-eng-review`, 2026-07-15)

**D1 — units fix scope (6e): unconditional µV→V, defer LSL units.** Scale the **eeg**
channels ×1e-6 in `load_data`, keyed on `ch_type == 'eeg'` (NOT positional `data[:-1]` —
explicit over clever; stim channel stays untouched). Correct for Muse (the shipping
device). External-LSL unit-correctness is an explicit TODO (see NOT in scope), not silent.

**D2 — sequence: data-integrity first, then QA in order, no revalidation pass.**
1. **First: correctness bugs** — 6e (units + zero-epoch guard), 7 (EEG default + no-EEG
   warning), 9a (folder), 9b (empty-Analyze guard/toast), 8 (USB removal).
2. **Then: work the remaining QA items in order** (1 → 2 → 3 → 4 → 5 → 6a-d → 6g).
   No dedicated re-QA gate between the two — proceed straight through.

Note (context, not a blocker): #7 means EEG defaulted off, so some downstream observations
(6c rendering, 9b) *may* have been influenced by a behavior-only run. Not gating on
re-validation per D2 — the impl session confirms as it goes.

---

## 1. Explore EEG: forgiving onboarding for electrode settling time

**Observed (Explore EEG Data screen, Muse just placed on head):** the raw trace is a
wall of scary red lines. This is the normal skin-conductance / electrode settling
artifact that resolves after the electrodes sit on the head for a bit — but a
first-time user has no way to know that. Reads as "broken / bad device."

**Where it lives:**
- Signal-quality color is std-dev based, per channel:
  `src/renderer/utils/eeg/pipes.ts` (`parseMuseSignalQuality`) maps std → GREAT/OK/BAD/DISCONNECTED.
  Thresholds `src/renderer/constants/constants.ts` `SIGNAL_QUALITY_THRESHOLDS`
  (BAD ≥ 15, OK ≥ 10, GREAT ≥ 1.5). At settling, std is high → everything BAD (red).
- Rendered by `SignalQualityIndicatorComponent.tsx` (head diagram fill) and the raw
  trace in `ViewerComponent.tsx`.
- Screen: `EEGExplorationComponent.tsx` (also gates the pre-connect vs connected view).
- Same red-on-settle problem almost certainly shows in the **connect / pre-test flow**
  (`CollectComponent/ConnectModal.tsx`, `PreTestComponent.tsx`) — check there too.

**Proposed fix shape (decide in impl session):**
- Add a settling window: track time-since-connect; for the first ~30–60s show a
  friendly banner/overlay ("Electrodes are settling — red is normal for the first
  minute while the sensors make contact. Sit still and watch it turn green.") with
  optional countdown or a "still settling…" amber state instead of raw BAD-red.
- Lightweight version (ponytail): banner + timer on the Explore + connect screens, no
  change to the quality math. Heavier: an explicit `SETTLING` signal-quality state
  derived from time-since-connect that suppresses BAD styling early on.
- Keep the honest state reachable — if it's *still* red after the window, that's a real
  bad-contact signal and should surface.

**Open question:** settle window length, and whether "settling" is time-based only or
also "std is trending down." Product-shaped — likely a quick /office-hours call.

---

## 2. Explore EEG: raw trace rendering is chunky / stutters

**Observed:** the scrolling EEG trace stutters and looks chunky. Long-standing, not new.
Suspected to be the SVG line-drawing approach.

**Where it lives:**
- Trace renders inside a bundled `<webview>` page driven by
  `src/renderer/components/d3Classes/EEGViewer.js` — d3 into an **SVG `<path>`**
  (`append('path')`, line 188), with `downsampling = 2` and `simplify-js` on incoming
  epochs. Host component: `ViewerComponent.tsx` (feeds epochs to the webview).
- Redrawing/growing SVG paths every plotting interval is the likely stutter source
  (SVG path re-layout, not GPU-accelerated).

**Proposed fix shape (decide in impl session):**
- Cheapest first: profile whether the jank is redraw cost vs. epoch cadence. Tune
  `downsampling`, `simplify-js` tolerance, and the d3 transition/`plottingInterval`
  before any rewrite.
- If SVG is genuinely the ceiling: swap the trace to `<canvas>` (2D) or WebGL. Note the
  epoch-review reviewer has the *same* SVG-vs-WebGL tension logged (see
  `docs/epoch-review-ui-plan.md` OQ1 / TODOS Phase 4 `drawEpochs`) — worth solving both
  with one rendering approach rather than twice.

**Ponytail flag:** don't jump to WebGL first. Profile + tune the existing SVG path; only
rewrite if measurement says SVG is the wall.

---

## 3. Generalize the signal-quality help content + surface it on Explore EEG

**Observed:** the Collect screen already has good signal-quality explanation content,
but the tips are written for the **old Emotiv device** and only exist on Collect. This
should be (a) generalized to be device-agnostic and (b) also shown on the Explore EEG
screen. Ties into #1 — the settling explanation and these tips are the same "help me
get a good signal" surface.

**Where it lives:**
- Content + stepper: `src/renderer/components/CollectComponent/HelpSidebar.tsx`
  (`HELP_STEP` enum + `renderHelpContent`). Exports `HelpSidebar` (full panel) and
  `HelpButton` (toggle).
- Mounted only in the Collect flow: `CollectComponent/PreTestComponent.tsx`
  (lines 125–168). `HelpButton` alone also appears in `AnalyzeComponent.tsx:514`.
- **Not present** on Explore EEG (`EEGExplorationComponent.tsx`) — that's the gap.
- File already carries a TODO: *"Refactor this into a more reusable Sidebar component
  that can be used in Collect, Clean, and Analyze screen"* — this item cashes that in.

**Emotiv-specific content to fix (device-agnostic rewrite):**
- `HELP_STEP.SIGNAL_SALINE` — "Saturate the sensors in saline" is Emotiv gel/saline-cap
  language. Muse uses dry/conductive electrodes — no saline soak. Drop or replace with
  Muse-appropriate guidance (skin contact, sweep hair, dampen skin if very dry).
- `SIGNAL_CONTACT` — "reference electrodes right behind the ears" *is* Muse-accurate
  (TP9/TP10 sit behind the ears), keep it. Audit the rest for Emotiv assumptions.
- Consider driving tips off the connected `deviceType` (Muse vs Neurosity vs external
  LSL) so the copy matches the hardware, rather than one hard-coded device.

**Proposed fix shape:**
- Extract `HelpSidebar` into a reusable, device-aware help panel (honors the existing
  refactor TODO). Add device-agnostic settling copy (folds in #1's explanation).
- Mount the `HelpButton` + panel on `EEGExplorationComponent.tsx` so Explore gets the
  same signal-quality help.
- Ponytail: don't build a full per-device content system if two shared strings + one
  Muse-specific override covers today's devices. Generalize only as far as the current
  device set needs.

## 4. Collect "Run Experiment" landing — ugly, wastes space, redesign

**Observed (step 2 COLLECT, pre-run landing):** the screen looks poorly designed. A
mystery empty input bar under the title, metadata stacked as plain text, a giant
full-width button, then a huge empty lower half. Wants efficient use of space.

**Where it lives:** `src/renderer/components/CollectComponent/RunComponent.tsx`
(the `!isRunning` branch, lines 102–134).

**Concrete problems found in the markup:**
- **The "empty input bar" is actually the edit button.** Line 106–112:
  `<button className="flex justify-end w-full">✏</button>` — a full-width button holding
  only a right-aligned pencil emoji. It renders as an empty full-width bar that reads as
  a broken/empty text field. Should be a small icon button beside the title or the
  subject metadata, not a `w-full` bar.
- **Metadata is unstyled stacked text** (Subject ID / Group Name / Session Number) —
  no card, no grouping, weak hierarchy.
- **`Run Experiment` is `w-full`** (line 125) — oversized primary action.
- **Everything is top-left with a vast empty lower half** — no layout using the space
  (e.g. centered card, or a two-column with device/signal status).
- **Redundant nested wrapper:** the outer `<div>` (line 97) *and* the inner `!isRunning`
  `<div>` (line 103) both set `h-screen p-[3%] bg-gradient-to-b …` — double gradient +
  double screen-height padding. Cheap cleanup, collapse to one.
- **Title duplicates the nav breadcrumb** — `<h1>{title}</h1>` repeats
  "Faces_and_Houses" already shown in the top nav dropdown. Consider dropping or
  repurposing.

**Proposed fix shape:**
- Rebuild as a compact centered card: title (or drop it), a clean subject/group/session
  summary block with a small inline edit (pencil) affordance, a right-sized primary
  "Run Experiment" button. Fill the space intentionally (center the card, or add
  device/signal-quality status alongside so the operator confirms readiness before run).
- Collapse the redundant `h-screen`/gradient wrapper.
- Design-shaped — worth a `/design-review` or `/design-consultation` pass in the impl
  session rather than eyeballing spacing.

**Ponytail:** this is one small component. Don't introduce a layout system — a single
centered `Card` (shadcn `Card` already exists) + right-sized button covers it.

## 5. No forward breadcrumb after finishing a run — flow dead-ends on Collect

**Observed:** completed the experiment and landed back on the same "Run Experiment"
screen. Nothing indicates the run is done or points forward to Clean. The only way to
advance is the top workflow nav (3 CLEAN) — undiscoverable for a first-timer; the flow
dead-ends.

**Where it lives:**
- Run finish path: `RunComponent.tsx` `onFinish` → `ExperimentActions.Stop({data})`
  (line 89–94). When `isRunning` flips false, it re-renders the *same* pre-run landing
  (the `!isRunning` branch, line 102) — there is **no post-completion state**. It looks
  identical to before the run, so "did it even record?" is unclear too.
- Forward nav today: the workflow steps in
  `src/renderer/components/SecondaryNavComponent/index.tsx` (`onStepClick` per step) →
  Clean route is `SCREENS.CLEAN.route` (`routes.tsx`, `constants.ts`). That's the only
  COLLECT→CLEAN path.

**Proposed fix shape:**
- Give `RunComponent` a distinct **post-run / completion state** (track "a run finished
  this session", e.g. off the `Stop` result / recorded file) that:
  - confirms the recording succeeded (filename, trial/marker count if cheap), and
  - shows a primary **"Clean your data →"** CTA that navigates to `SCREENS.CLEAN.route`
    (reuse the same routing the secondary nav step uses), plus a secondary "Run again."
- This is the same "guide the operator to the next step" gap that #4's redesign touches
  — do them together in the Collect/Run pass.

**Ponytail:** don't build a wizard. One completion panel with a "Clean your data →"
link-button (react-router `Link` is already imported in `RunComponent`) closes the gap.

## 6. Clean screen — multiple issues (layout, labels, viewer, and a real units bug)

**Screen:** `src/renderer/components/CleanComponent/index.tsx` (+ `webworker/utils.py`).
Dano's walkthrough surfaced four UX asks plus, on auto-flag, a genuine data bug.

### 6a. Settings gear icon is mis-sized
The ⚙︎ auto-flag settings button (`CleanComponent/index.tsx` ~line 352–359) looks
too-big / not-big-enough next to "Clean Data" and "Auto-flag artifacts". Size it to
match the adjacent buttons (icon-button sizing / same height).

### 6b. Condition labels show STIMULUS_1 / STIMULUS_2 instead of real names (Faces, Houses)
Counts, legends, and the ERP all read "STIMULUS_1 / STIMULUS_2". Should show the
experiment's real condition names ("Faces", "Houses").
- Source of the generic labels: `src/renderer/utils/eeg/markerRegistry.ts` —
  `CODE_TO_LABEL` is hard-coded `STIMULUS_1..4` (deliberately "condition-neutral").
  `buildMarkerRegistry` only ever emits those.
- Fix shape: let the registry derive a human label from the experiment's stimulus
  metadata (per-experiment code→name map, e.g. Faces_and_Houses: 1→Faces, 2→Houses),
  falling back to `STIMULUS_n` when unknown. Keep the numeric code contract intact
  (labels are display-only; codes still drive CSV + MNE `event_id`). Thread the real
  label into the Clean counts/legend/ERP.
- Ponytail: don't build an i18n/label system — a per-experiment `{code: name}` map on
  the experiment object, read by `buildMarkerRegistry`, covers it.

### 6c. Epoch viewer is too small and renders poorly
The Epochs panel gets too little real estate and the traces render badly (same
SVG-trace rendering concern as #2). Ties to the epoch-reviewer WebGL/`drawEpochs`
question already logged (`docs/epoch-review-ui-plan.md` OQ1, TODOS Phase 4).

### 6d. Re-layout to prioritize Epochs + add a reject-onboarding flow
Give the Epochs viewer much more space, and preempt an onboarding flow that teaches
students how to read epochs and reject bad ones. **This is already scoped** as
**Epoch reviewer Phase 3 — onboarding layer** in TODOS.md (plain-language epoch/artifact
explanations, guided mode, channel legend tied to head position). This walkthrough is
direct evidence for prioritizing it. Route the product questions (onboarding depth,
guided-mode-as-default — TODOS OQ3) through /office-hours or /plan-ceo-review.

### 6e. 🔴 BUG: Auto-flag rejects ALL epochs — µV→V units error (NOT threshold too low)
**Observed:** "Auto-flag artifacts" flagged all 16/16 epochs → ERP averages over 0
epochs (blank). Flag reasons: **peak-to-peak 65,715,724 µV / 66,228,063 µV /
89,980,195 µV**. Dano's read was "thresholds too low"; the real cause is deeper.

**Root cause (grounded):** 65 million µV = ~65 **volts** peak-to-peak is physically
impossible for EEG (real Muse ptp is tens of µV; the amp rails well under 1 mV). The
value is inflated ~1e6×:
- `webworker/utils.py` `load_data` (lines ~90–95) builds `RawArray(data=data, …)`
  straight from the CSV values with **no µV→V scaling**. MNE treats EEG channel data as
  **volts**, but the Muse CSV is in **µV**. So a real ~65 µV excursion is loaded as
  ~65 "volts".
- `suggest_rejections` (utils.py ~line 350–359) computes ptp in MNE's unit (thinks
  volts) then `* 1e6` to report µV → 65 → 65,000,000 µV. Threshold default
  `DEFAULT_PTP_THRESHOLD_UV = 100` (`constants.ts:12`) → `thresh_v = 1e-4 V`, but ptp is
  ~65 in MNE units, so **every** epoch exceeds it.

**Fix shape:** scale CSV µV → V on load in `load_data` — multiply the **eeg** channels
by `1e-6` before/at `RawArray` (do NOT scale the last `stim`/Marker channel; markers are
numeric codes — see `.llms/learnings.md`). After the fix, ptp ≈ 65 µV, the 100 µV
default behaves sanely, and auto-flag stops nuking everything. **Verify against the
golden test** (`tests/analysis/test_erp_roundtrip.py`) — a global scale factor won't fail
its relative-amplitude assertions, so add an absolute-µV sanity check so this can't
regress silently. Also audit downstream consumers that assume the current (wrong) scale:
epoch viewer amplitude, `amp +/−`, ERP y-axis, `SetEpochInfo` payloads.

**Do not** just raise `DEFAULT_PTP_THRESHOLD_UV` — that hides a real correctness bug and
would let genuine artifacts through once the units are fixed.

### 6f. ⚠ Flagged console error (see-something-say-something)
The Clean screen logs `The specified value "NaN" cannot be parsed, or is out of range`
(repeating). Likely a DOM/SVG/input attribute being set to `NaN` — plausibly the epoch
viewer or the `amp`/threshold `<input>` receiving `NaN`. Not user-reported; flagging so
the impl session tracks it down (may share a cause with 6c/6e).

### 6g. Auto-flag threshold: slider with device presets, not a raw µV number input
**Observed:** the threshold is a bare absolute-µV number `<input>` — students have no
idea what number to type. Make it a streamlined **slider** with sensible values
**pre-selected per device** (Muse vs Neurosity vs external LSL), so users adjust
sensitivity intuitively instead of guessing microvolts.

**Where it lives:** `CleanComponent/index.tsx` — `autoFlagThreshold` state (default
`DEFAULT_PTP_THRESHOLD_UV = 100`, `constants.ts:12`) rendered as a numeric `<input>` in
the auto-flag settings panel (~lines 369–378); parsed in the `!Number.isNaN` handler
(~line 206–213). shadcn has no Slider yet — add `@radix-ui/react-slider` (same family as
the already-installed Select) or a styled native `<input type="range">`.

**Fix shape:**
- Replace the number input with a slider (labeled low/high sensitivity, showing the
  current µV under the hood but not requiring users to reason in µV).
- Seed the default + range from the connected device — a per-device preset map
  (reasonable ptp ceilings differ by hardware). Fall back to `DEFAULT_PTP_THRESHOLD_UV`.
- **Depends on 6e:** presets are only meaningful once the µV→V units bug is fixed —
  otherwise "100 µV" doesn't correspond to reality. Sequence 6e before tuning presets.

**Ponytail:** a native `<input type="range">` + a small `{device: {min,max,default}}`
map covers this — no slider component library required unless the design calls for it.

## 7. EEG disabled by default + no warning when running without EEG

**Observed:** ran an experiment with EEG not connected, was **not notified**, and found
"Enable EEG" was **off by default** — nonsensical for an EEG app. Result: a run that
records behavior but no brain data, silently.

**Where it lives:**
- Default: `src/renderer/reducers/experimentReducer.ts:38` — initial state
  `isEEGEnabled: false`. Toggled via `SetEEGEnabled` (`experimentActions.ts:38`); the
  toggle UI is the "Enable EEG" switch in `SecondaryNavComponent` SettingsDropdown
  (wired from the workflow screens, e.g. `DesignComponent`).
- Cascade when `isEEGEnabled === false`:
  - `CollectComponent.componentDidMount` skips auto-connect (only connects if EEG on).
  - `RunComponent`: `isRunComponentOpen` initializes to `!isEEGEnabled` → opens straight
    to the Run screen, bypassing connect/pre-test.
  - `RunComponent.eventCallback` gates on `isEEGEnabled` → **no markers injected**, so
    even if a device were streaming, this path wouldn't tag events.
  - Net: no device, no markers, no warning — the operator only finds out later (empty
    EEG, e.g. the Clean screen).

**Proposed fix shape:**
- **Flip the default to `isEEGEnabled: true`** (one line in `experimentReducer.ts`).
  EEG-on is the app's whole point; opt *out* for the behavior-only case, not opt in.
- **Warn before a no-EEG run.** When starting a run with EEG enabled but no device
  connected — or with EEG disabled — surface a clear confirm ("EEG is not connected —
  this run will record responses but no brain data. Continue?"). `RunComponent`'s
  `handleStartExperiment` already does a `showMessageBox` confirm for file-overwrite;
  reuse that pattern for the no-EEG case.
- Consider persisting the user's EEG-enabled choice rather than resetting per session.

**Ponytail:** the default flip is one line; the guard is one extra `showMessageBox`
branch in the existing `handleStartExperiment`. No new state machine needed.

## 8. Remove the "Insert the USB Receiver" modal step (Emotiv-era, irrelevant for Muse)

**Observed:** the connect flow still has an "Insert the USB Receiver" step. Muse is
Bluetooth — no dongle. Remove it.

**Where it lives:** `src/renderer/components/CollectComponent/ConnectModal.tsx`.
Local `enum INSTRUCTION_PROGRESS { SEARCHING, TURN_ON, COMPUTER_CONNECTABILITY }`
(line 42). Flow: `TURN_ON` ("headset on & charged") → **`COMPUTER_CONNECTABILITY`**
("Insert the USB Receiver", lines ~260–293) → `handleSearch()` → device list.

**Exact removal (trivial, ready to implement):**
1. Delete the `COMPUTER_CONNECTABILITY` render block (lines ~260–293).
2. In the `TURN_ON` step, change **Next** (lines ~245–255) from
   `handleinstructionProgress(INSTRUCTION_PROGRESS.COMPUTER_CONNECTABILITY)` to call
   `this.handleSearch` directly (what the USB step's Next did) — so "headset on" flows
   straight to searching.
3. Remove `COMPUTER_CONNECTABILITY` from the enum.
4. Leave the device-list "Back" / "Don't see your device?" targets (`…Progress(1)` =
   `TURN_ON`) as-is — still valid.

**Note:** this is small and low-risk — a good candidate to just land in the impl session
(clean tree → one atomic commit). No product decision needed.

## 9. Analyze screen empty after Clean→Analyze + "Go to Folder" broken (two real bugs)

### 9a. 🔴 BUG: "Go to Folder" on Home does nothing — relative path to shell API
**Observed:** the "Go to Folder" button on the Home screen doesn't open the workspace,
blocking any manual check of what was written.

**Root cause (grounded):** `src/renderer/utils/filesystem/storage.ts:29`
```
openWorkspaceDir = (title) => api().showItemInFolder(path.join('BrainWaves_Workspaces', title))
```
passes a **relative** path `"BrainWaves_Workspaces/<title>"` to
`shell.showItemInFolder` (`src/main/index.ts:159`). `shell.showItemInFolder` requires an
**absolute** path — given a relative, non-existent one it silently no-ops. The real
workspace dir is absolute: `path.join(os.homedir(), 'BrainWaves_Workspaces', title)`
(`main/index.ts:116–118`, `getWorkspaceDir`). Called from
`HomeComponent/index.tsx:250`.

**Fix shape:** resolve the absolute path in main, not the renderer. Add a
`shell:openWorkspaceDir` handler that does `shell.openPath(getWorkspaceDir(title))`
(opening the folder is better UX than `showItemInFolder`, which highlights the item in
the parent). Point `openWorkspaceDir` at it. Removes the relative-path guesswork and the
duplicated `'BrainWaves_Workspaces'` literal. Small, isolated fix.

### 9b. 🔴 BUG: Analyze "Select Clean Datasets" is empty after cleaning
**Observed:** cleaned the dataset, clicked Analyze, and the "Select Clean Datasets"
picker is empty — nothing to analyze.

**Grounding — the write/read paths MATCH, so the file wasn't written (not a scan miss):**
- Write: `fs:writeCleanedEpochs` (`main/index.ts:332`) →
  `<workspace>/Data/<subject>/EEG/<subject>-cleaned-epo.fif`.
- Read: `fs:readWorkspaceCleanedEEGData` (`main/index.ts:246`) scans the workspace
  recursively for the `epo.fif` suffix — `-cleaned-epo.fif` matches. So the picker would
  list the file **if it existed**. Empty ⇒ no cleaned `.fif` on disk.
- Save trigger: the worker must emit a `dataKey === 'savedEpochs'` message with a buffer;
  only then does `pyodideEpics.ts:129–145` call `writeCleanedEpochs` (+ "Cleaned data
  saved" toast). If that message/buffer never arrives, nothing is written and nothing
  errors.

**Two suspects for the impl session (verify, don't assume):**
1. **Consequence of the units bug (6e):** on this run auto-flag had marked **all 16/16
   epochs** for rejection. If Dano clicked "Clean Data" with everything flagged, the drop
   removes every epoch → the saved Epochs object is **empty**, which may fail to write a
   valid `.fif` (or write a degenerate one that the scan/parse skips) — with no user-
   facing error. Fix 6e first, then re-test a normal clean (few rejections). Also: **guard
   against cleaning to zero epochs** (warn / block "Clean Data" when the drop set == all
   epochs) so a student can't silently destroy their dataset.
2. **The known worker-RPC FIFO fragility** (see `.llms/learnings.md` / TODOS "Full Pyodide
   worker RPC"): `worker.postMessage` awaits are no-ops, so the drop→save→re-fetch
   sequence relies on FIFO ordering. If the save step's buffer is dropped/empty, the
   `savedEpochs` branch silently writes nothing. Add an explicit failure surface — if
   `savedEpochs` never arrives (or arrives empty), toast an error instead of failing
   silent.

**Common thread with the whole walkthrough:** silent failure. Collect ran with no EEG and
no warning (#7); auto-flag nuked everything from a units bug (#6e); cleaning to zero
epochs produced an unanalyzable dataset with no error here. The impl session should add
user-facing guards/toasts at each of these "you just destroyed your data" moments.

<!-- append new walkthrough items below as Dano surfaces them -->

---

## Test coverage (from /plan-eng-review)

Frameworks: **pytest** (`tests/analysis/`, native MNE — the data path) + **vitest** (JS).
Most UX items are visual → verified via `/qa` or manual, no unit test. The code-logic
items need tests:

```
CODE PATHS (testable)                                    STATUS
[6e] webworker/utils.py load_data — µV→V scale
  ├── [GAP → CRITICAL] eeg channels scaled ×1e-6         regression test REQUIRED (iron rule)
  │     assert ptp of a known recording lands ~20–150µV, NOT ~1e6×
  │     (same tests/analysis suite as jitter/dropped-sample — prior learning)
  └── [GAP] stim/Marker channel NOT scaled               assert marker codes unchanged (still 1,2)
[6e/6d] Clean "Clean Data" zero-epoch guard
  └── [GAP] dropSet == all epochs → block/warn           unit/integration: no empty .fif written
[7] experimentReducer isEEGEnabled default
  ├── [GAP] initial state === true                       trivial unit test
  └── [GAP] start-run-without-device → warn path         RunComponent handleStartExperiment branch
[6b] buildMarkerRegistry — condition names
  └── [GAP] type→stimulus.condition label ("Faces")      unit test in markerRegistry test
[9a] openWorkspaceDir absolute path                      manual verify (shell call); low ROI to unit
[9b] savedEpochs never-arrives → error toast            [GAP] integration: assert toast on empty save

COVERAGE: data-path logic largely UNTESTED for these paths. 6e regression = mandatory.
```

## Failure modes (new/changed codepaths)

| Codepath | Realistic failure | Test? | Error handling? | User sees |
|----------|-------------------|-------|-----------------|-----------|
| 6e µV→V scale | scale applied to stim row too → marker codes corrupted | ADD | n/a | **silent** wrong ERPs — **critical gap** until test added |
| 6e zero-epoch clean | user drops all epochs → empty/invalid `.fif` | ADD | ADD guard | today: silent; after fix: warned |
| 7 no-EEG run | run with device disconnected | ADD | ADD confirm | today: **silent** no-data run — critical gap |
| 9b cleaned-save | worker `savedEpochs` never arrives / empty buffer | ADD | ADD toast | today: **silent** empty Analyze — critical gap |
| 9a folder open | relative path → shell no-op | manual | already logs | today: silent no-op |

**Critical gaps (silent failure + no test + no handling, today):** 6e stim-scaling,
7 no-EEG run, 9b cleaned-save. All three get a guard/toast in the correctness PR.

## NOT in scope (deferred, with rationale)

- **External-LSL unit correctness** — the µV→V fix assumes µV CSV (true for Muse). LSL
  streams may carry V or arbitrary units; proper per-stream unit metadata is its own task
  (touches write path + IPC). Deferred per D1; TODO below.
- **Epoch-viewer WebGL rewrite (2 / 6c)** — profile + tune SVG first; rewrite only if
  measured as the ceiling. Unify with epoch-reviewer `drawEpochs` (Phase 4) if it happens.
- **Full per-experiment label i18n (6b)** — wire `stimulus.condition` only; no label system.
- **Reject-onboarding curriculum depth (6d)** — product decision (Epoch reviewer Phase 3
  / TODOS OQ3); route through /office-hours, not this backlog.
- **Worker-RPC refactor (9b suspect 2)** — the real `runPython` RPC is already a standing
  TODO; here we only add a failure toast, not the refactor.

## What already exists (reuse, don't rebuild)

- 6b: `Stimulus.condition` / `condition_first_title` already carry "Faces"/"Houses";
  `buildMarkerRegistry(stimuli)` already receives them.
- 7: `showMessageBox` confirm pattern already in `RunComponent.handleStartExperiment`.
- 5: react-router `Link` already imported in `RunComponent`.
- 9a: `getWorkspaceDir` already resolves the absolute workspace path.
- 4: shadcn `Card` exists. 3: HelpSidebar refactor already a standing TODO.

## Implementation Tasks

**Implementation status (2026-07-15, autonomous pass on `epoch-reviewer-phase2`).**
12 atomic commits `beb1620..376740f`. All 48 JS + 18 Python tests green.

- [x] **T1 (P1)** — webworker/utils.py — scale eeg channels µV→V in `load_data` (key on `ch_type=='eeg'`) — `beb1620`
  - Also emits µV at the two display boundaries (`get_epochs_arrays`, ERP plot) so
    the viewer/plot show the same numbers; regression guard asserts ptp 1–1000µV;
    fixed `test_detects_injected_artifact` (was a ptp-neutral DC offset that only
    "passed" because the units bug flagged everything).
- [x] **T2 (P1)** — Clean — guard "Clean Data" when drop set == all epochs (confirm before drop) — `1e38197`
- [x] **T3 (P1)** — experiment — `isEEGEnabled` default `true` + warn on no-EEG-connected run — `7fdccfb`
- [x] **T4 (P1)** — main — `openWorkspaceDir` uses absolute path (`shell.openPath(getWorkspaceDir(title))`) — `68a410b`
- [x] **T5 (P2)** — error toast when worker `savedEpochs` arrives empty/missing — `4247b15`
  - Empty-buffer backstop (trivial branch, no integration test — real prevention is T2).
- [x] **T6 (P2)** — ConnectModal — remove USB-receiver step (`COMPUTER_CONNECTABILITY`) — `c1cb40d`
- [x] **T7 (P2)** — markerRegistry — map `type → stimulus.condition` for display labels — `69396e4`
  - Real names are "Face"/"House" (the source `condition`); Clean legend + Python ERP
    pick them up automatically. Guards against two codes collapsing under one label.
- [~] **T8 (P2/P3)** — UX polish, in order. **Done:** 1-lite (settling banner, `5f2fc1e`),
  3 (help de-Emotiv + Explore mount, `5f2fc1e`), 4-markup (empty-bar button, dedupe
  wrapper, Card landing, `45afe4b`), 5 (forward CTA, `b68096a`), 6a (gear icon-size,
  `8d15e44`), 6g (sensitivity slider, `8d15e44`), 6f (very likely resolved — the only
  `type="number"` input, the sole source of that DOM `"NaN"` error, was replaced by the
  6g slider; needs live confirmation). Analyze warm empty state (T11 subset, `376740f`).
  **Deferred (need live app / device / design-review — see below):** 2 (trace perf —
  profile first), 4-DF1 (two-column live-signal column), 6c (epoch-viewer perf/space),
  6d (Clean re-layout + onboarding, Phase 3 / office-hours), DF2-full (amber per-dot
  state — touches quality math), T13 a11y (settling banner/slider/gear done; rest with
  the deferred visual work).

### Deferred — why, and what unblocks them
- **#2 trace perf / #6c epoch-viewer perf** — the plan itself says *profile the SVG/
  canvas first, rewrite only if measured as the ceiling*. Needs the live Electron app +
  a streaming device to profile; can't be done blind. Unify with epoch-reviewer
  `drawEpochs` (Phase 4) if a rewrite happens.
- **#4 DF1 two-column live-signal column** — the markup fixes shipped; the full
  two-column layout with a live signal-quality head requires wiring the signal
  observable into `RunComponent` **and** visual verification. Do it in a live
  `/design-review` pass (the plan flagged this item as design-review-shaped).
- **#6d Clean re-layout + reject-onboarding** — product-shaped (Epoch reviewer Phase 3);
  route onboarding depth / guided-mode through `/office-hours` per the plan.
- **DF2 full amber per-dot settling** — the lightweight time-based banner shipped; the
  per-dot amber state touches `pipes.ts` quality math and needs device verification.

---

## Design decisions (`/plan-design-review`, 2026-07-15)

App-type: **APP UI** (data-dense EEG workspace) — calm hierarchy, utility copy, minimal
chrome, cards only when the card *is* the interaction. Calibrated against `.llms/CLAUDE.md`
styling (teal `#007c70`, gold `#ffc107`, signal colors, shadcn, student-fun tone).

**DF1 — Collect "Run Experiment" landing (item 4): two-column, function-filled.**
Left column: run summary (subject/group/session) with a small inline edit pencil + a
right-sized primary "Run Experiment" button. Right column: **live signal-quality head +
connection status**, so the operator confirms the device is ready before launching.
Kills the empty lower half with function, not a decorative floating card. Bonus: this is
the visual home for the no-EEG guard (#7) — readiness is *seen*, not just enforced.

**DF2 — Explore settling onboarding (item 1): amber settling state + auto-dismiss banner.**
For the first ~45s after connect, the head-diagram dots show a neutral **amber "settling"**
state (not red), with a non-blocking `role="status"` banner: "Sensors settling — this is
normal. Sit still and watch them turn green." Auto-dismiss when settled. After the window,
real quality colors return and genuine bad-contact still surfaces red. No blocking modal /
forced tour (App UI rule). Settling ≠ bad: during the window the signal isn't valid yet, so
amber is *more* accurate than red, not a lie.

### Interaction states table (Pass 2 — the biggest gap; maps to the silent-failure through-line)

| Feature | Loading | Empty | Error | Success | Settling/partial |
|---|---|---|---|---|---|
| Explore signal | connecting spinner | — | device lost → toast + reconnect CTA | live quality colors | **amber settling + banner (DF2)** |
| Collect run | — | subject blank → button disabled + inline hint | no-EEG connected → confirm dialog (#7) | run launches | device connecting → status in right column (DF1) |
| Post-run (item 5) | "Recording…" | — | save failed → error toast + retry | **completion panel + "Clean your data →"** | — |
| Clean epochs | loading spinner | no epochs → warm "No epochs yet — collect data first" | units/parse error → toast | epochs render | zero-epoch clean → **warn before drop (6e/T2)** |
| Analyze picker | — | no datasets → warm "No cleaned data yet — clean a recording first · [Go to Clean]" (9b) | save-never-arrived → toast (T5) | datasets listed | — |

Empty states are features: each carries warmth + a primary action, not "No items found."

### Layout / copy specifications (smaller items)

- **6a gear:** icon-button sized to match adjacent button height (same `h-*` as "Clean
  Data"); keep `aria-label`. It's a settings toggle, not a primary action — secondary weight.
- **6b labels + emoji:** once real names land (`stimulus.condition`), legend/counts read
  **😊 Faces / 🏠 Houses**. Keep the emoji — fun student tone, and it's always paired with a
  text label (not emoji-as-bullet, so not AI-slop). The text label is also the a11y
  equivalent for the emoji.
- **6d Clean re-layout hierarchy:** Epochs is the **primary** region — give it the larger
  share (~60% width + more height); Live ERP is **secondary**. Group the epoch controls
  (Prev/Next, amp ±, channel) into one toolbar. The reject-onboarding (Phase 3) is a
  **dismissible first-run coach layer**, never a blocking modal.
- **6g slider:** labeled by sensitivity (low↔high), current µV shown as `aria-valuetext`,
  not the primary label; native keyboard arrows suffice.

### Accessibility specs (Pass 6 — Electron fixed-window, so a11y > responsive)

- Settling banner: `role="status"` `aria-live="polite"` — announces settle progress without
  stealing focus. Amber vs green must clear 3:1 non-text contrast; never color-alone (banner
  text carries meaning).
- ERP legend uses **red vs green** — the worst colorblind pairing. Keep the text/emoji
  labels beside the swatches (already present) so condition is never color-only.
- Slider + gear: keyboard-operable, visible focus ring, ≥44px (or match button height).
- Primary buttons: white-on-teal `#007c70` meets 4.5:1 — fine. Body text ≥16px.

## Design Implementation Tasks

- [ ] **T9 (P2)** — Collect — rebuild landing as two-column (summary+edit / live signal+status) per DF1
  - Surfaced by: DF1 (item 4). Files: `RunComponent.tsx`. Verify: `/qa` + operator sees signal before Run
- [ ] **T10 (P2)** — Explore — amber settling state + `role=status` auto-dismiss banner per DF2
  - Surfaced by: DF2 (item 1). Files: `EEGExplorationComponent.tsx`, `pipes.ts`/signal components, `ConnectModal`/`PreTestComponent`. Verify: amber first ~45s, real colors after, bad-contact still red
- [ ] **T11 (P2)** — Clean/Analyze/Collect — warm empty + error states per interaction table
  - Surfaced by: Pass 2. Files: `CleanComponent`, `AnalyzeComponent`, `RunComponent`. Verify: each empty/error state shows warmth + primary action
- [ ] **T12 (P3)** — Clean — re-layout: Epochs primary (~60%+height), ERP secondary, grouped toolbar
  - Surfaced by: 6d. Files: `CleanComponent/index.tsx`. Verify: `/design-review` after build
- [ ] **T13 (P3)** — a11y pass — settling banner/slider/gear/legend per a11y specs
  - Surfaced by: Pass 6. Files: touched components. Verify: keyboard nav + contrast check

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open | 2 decisions locked, 3 critical failure-mode gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | 3/10 → 8/10, 2 forks locked, states table added |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **UNRESOLVED:** 0 (Eng: D1 units, D2 sequencing. Design: DF1 Collect layout, DF2 settling).
- **CRITICAL GAPS:** 3 silent-failure paths (6e stim-scaling, 7 no-EEG run, 9b cleaned-save) — each gets a guard/toast + test in the correctness PR (T1–T3, T5).
- **CROSS-MODEL:** the design states-table and DF1 reinforce the eng review's #7 guard — readiness is now both enforced (dialog) and visible (signal column).
- **VERDICT:** ENG + DESIGN CLEARED — ready to implement. Data-integrity PR (T1–T4) first, then QA items in order (D2); design items (T9–T13) fold into the UX phase (T8).
