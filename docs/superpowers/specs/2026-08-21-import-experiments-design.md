# Import Experiments — Design

**Date:** 2026-08-21
**Status:** Approved design; implementation plan not yet written.
**Scope:** Add an *Import Experiment* path that runs externally-authored jsPsych timelines and lab.js studies inside BrainWaves, alongside the existing built-in experiments and the Custom builder.

---

## 1. Problem

BrainWaves runs only experiments authored by BrainWaves. Every built-in study and the Custom builder emit lab.js object graphs from `src/renderer/experiments/`, which `ExperimentWindow.tsx:40` deserializes with `lab.core.deserialize`. A teacher who arrives with an existing jsPsych task has no way in.

The naive framing — "let their file run in our HTML context" — produces a *player*. BrainWaves is not a player. Clean and Analyze are the product, and they rest on three contracts that an externally-authored experiment satisfies **none** of:

1. **Markers.** jsPsych core has no trigger, EEG, or hardware-marker API of any kind; the community answer is a Chrome extension writing to a parallel port. BrainWaves markers come from `triggerEEGCallback` (`src/renderer/utils/labjs/functions.ts:171`), a hook hand-wired into BrainWaves' own lab.js graphs. An imported file calls nothing, so the EEG CSV `Marker` column stays `0`, `find_events` (`src/renderer/utils/webworker/utils.py:108`) returns nothing, epochs come back empty, and Clean and Analyze become dead screens over a technically-valid recording of nothing.

2. **Behavioral schema.** jsPsych's only universal columns are `trial_type`, `trial_index`, and `time_elapsed`. `src/renderer/utils/behavior/compute.js` requires `condition`, `reaction_time`, `correct_response`, `response_given`, `trial_number`, and `phase`. Overlap: zero.

3. **Stimulus registry.** `buildMarkerRegistry(params.stimuli)` (`src/renderer/utils/eeg/markerRegistry.ts:56`) is the single source of truth binding collection codes to MNE's `event_id` at `src/renderer/epics/pyodideEpics.ts:194`. Imported experiments have no `params.stimuli`.

The runtime is days of work. **The integration contract is the feature.**

### Prior art in this repo

This is a return, not a first. `openexp/jspsych-react` was BrainWaves' runtime until v0.9.0, and the remains are still in tree:

- `src/main/index.ts:187` opens a dialog titled *"Select a jsPsych timeline file"*, reachable through `FILE_TYPES.TIMELINE` (`src/renderer/constants/constants.ts:134`). Nothing calls it.
- `src/renderer/app.global.css:63,71` still style `#jspsych-image-keyboard-response-stimulus` and `.jspsych-display-element`.

`TODOS.md:31` and `ROADMAP.md:34` both list removing these strings as cleanup. They should instead be adopted.

---

## 2. Decisions

Each row records a fork that was resolved during design, with the reason. These are settled; the implementation plan should not reopen them.

| # | Fork | Decision | Rationale |
|---|---|---|---|
| 1 | How does an imported experiment earn EEG support? | Opt-in adapter, with behavior-only fallback | Experiments that participate get full Clean/Analyze. Those that don't still import and run, with the EEG toggle forced off — an honest, already-first-class mode rather than a broken one. |
| 2 | Where does third-party code execute? | Same renderer, mounted div — but behind a distinct component | Isolation and code separation are orthogonal axes. Same-realm keeps v1 simple; the separate component is what makes a later isolation upgrade a one-file change instead of a rewrite. |
| 3 | What artifact does the user hand us? | A single `.js` timeline plus an optional asset folder | We control the jsPsych version, the plugin set, and adapter injection. Bundle-folder imports would surrender all three and pull in CDN `<script src>` tags that fail on offline classroom machines. |
| 4 | Which plugins ship? | All 53 official `@jspsych/plugin-*`; extensions case-by-case | Each plugin is tens of KB against a 273.8 MB dmg that already carries Pyodide. Every omitted plugin is a hard `ReferenceError` and a support ticket. `extension-webgazer` drags in WebGazer, so extensions are not wholesale. |
| 5 | Where do condition labels come from? | The author's own `data.<key>` strings; BrainWaves owns the numeric codes | Numeric codes 1–4 exist only because MNE scans a numeric stim channel. That is BrainWaves plumbing, and putting it in the author's file is the abstraction leak `.llms/CLAUDE.md:11` warns against. |
| 6 | How are codes assigned stably? | A post-import Markers tab, pre-populated by a static scan | Codes must be frozen before the first subject. Interning on encounter order gives subject A `Face=1` and subject B `Face=2` under different randomization, silently corrupting cross-subject ERP averaging. |
| 7 | Where does the imported file live? | Copy the `.js` into the workspace; reference assets in place | The timeline *is* the experiment — if it moves the workspace is dead, not degraded — and it is a small text file, so disk duplication is irrelevant. Assets keep the existing `bwfile://` allowlist behaviour, leaving `TODOS.md:17`'s pending user-testing decision open rather than pre-empting it. |
| 8 | Rename "Custom"? | Change the display label to "Experiment Builder"; leave the enum value alone | `EXPERIMENTS.CUSTOM = 'Custom'` is persisted as `type` in `appState.json` and re-derived on load via `getExperimentFromType`. Changing the value breaks every saved workspace. The label is free. |

### Rejected alternatives worth recording

- **Auto-deriving markers from a timeline dry-run.** Only observes the branches one pass happened to take. Randomization, conditional nodes, and timeline variables — the constructs real jsPsych experiments are built from — mean a code that fires on some runs is silently absent from `event_id`, and those epochs vanish with no error. This is precisely the failure the comment at `pyodideEpics.ts:191` warns about: *"array indices silently dropped codes that didn't match."*
- **Alphabetical interning of observed condition strings.** Deterministic for a given set, but the set is unknown until a run ends, so it fails across subjects for the same reason.
- **Requiring the author to declare numeric codes** (`brainwaves.declareConditions({1: 'Face'})`). Leaks BrainWaves' stim-channel encoding into a portable jsPsych file. Superseded by decision 5.
- **Cross-origin iframe on a `bwexp://` scheme, and out-of-process `<webview>`.** Both give real isolation; both were declined for v1 on complexity grounds. The `<webview>` route additionally collides with `src/main/index.ts:701`, which unconditionally forces `preload = ../viewer/viewer.js` on every webview and would therefore edit the live EEG viewer's attach path.

---

## 3. Architecture

### 3.1 The runtime seam

`ExperimentWindow.tsx` is already a leaky lab.js abstraction rather than a neutral host: it does `import * as lab`, calls `lab.core.deserialize` at line 40, reaches into `experimentToRun.internals.controller.audioContext` at lines 88 and 99, and carries `onFinish: (csv: any)` annotated *"lab.js finish event data — shape is opaque third-party type"* at line 19. Branching jsPsych inside it would compound that, on the exact component the P0 custom-experiment path depends on.

Two sibling components behind one shared props type, and a dispatcher. No registry, no class hierarchy, no plugin architecture.

```
ExperimentRuntimeProps
  title: string
  fullScreen?: boolean
  eventCallback: (code: number, time: number) => void
  onFinish: (csv: string) => void

├── LabjsExperimentWindow      // today's ExperimentWindow, renamed; internals unchanged
└── ImportedExperimentWindow   // new; all third-party weirdness contained here
```

`RunComponent` (`src/renderer/components/CollectComponent/RunComponent.tsx`) and `PreviewExperimentComponent` render the dispatcher and never learn which runtime ran. Preview therefore comes free: same component, `fullScreen=false`, no-op marker callback.

A later move to iframe or webview isolation is confined to `ImportedExperimentWindow`.

### 3.2 The jsPsych host

The author's file calls `initJsPsych()` exactly as jsPsych documents. We make that *our* function, injected onto `window` before evaluation:

```ts
window.initJsPsych = (authorOptions = {}) =>
  realInitJsPsych({
    ...authorOptions,
    display_element: hostDivId,
    override_safe_mode: true,
    on_trial_start: (trial) => {
      const label = trial.data?.[conditionKey];
      if (label !== undefined) {
        requestAnimationFrame(() => eventCallback(codeFor(label), Date.now()));
      }
      authorOptions.on_trial_start?.(trial);
    },
    on_finish: (data) => {
      authorOptions.on_finish?.(data);
      onFinish(toBehavioralCsv(normalize(data.values())));
    },
  });
```

Three consequences of owning this call:

**`override_safe_mode: true` is mandatory, and dev will never reveal why.** jsPsych's constructor checks `window.location.protocol == "file:"` and, unless overridden, sets `use_webaudio = false` and disables video preloading. Production loads the renderer with `mainWindow.loadFile(...)` (`src/main/index.ts:745`), so the check fires. Development runs on `http://localhost:5173` and looks perfect. This is the same prod-only class that `TODOS.md:13` already tracks for Pyodide.

**Author callbacks chain rather than clobber.** Any experiment supplying its own `on_trial_start` or `on_finish` still has it invoked.

**Marker timing carries a known systematic offset.** lab.js fires `triggerEEGCallback` from a screen's `run` hook, i.e. at render. jsPsych's nearest *global* hook is `on_trial_start`, which fires **before** the plugin writes DOM. Scheduling through `requestAnimationFrame` from that hook should land after the DOM write and before paint. This ordering is **inferred, not measured** — it must be validated on hardware before any ERP claim (see §8). A trial-level `on_load` would be exact but requires walking the timeline, which dynamic timelines defeat.

### 3.3 Plugin loading

All 53 official `@jspsych/plugin-*` packages become npm dependencies, and each exported class is assigned to its official global before the author's script is evaluated.

The mechanism is verified: official plugin IIFE builds are `var jsPsychHtmlKeyboardResponse = (function (jspsych) { … })(jsPsychModule)`, and the global name is `jsPsych` + camelCase of the dashed plugin name, set via `makeRollupConfig("jsPsychHtmlKeyboardResponse")` in each package's `rollup.config.mjs`. jsPsych v8 takes the plugin **class** as `type:`, so a global class reference is exactly what a script-style timeline needs. `window.jsPsychModule` must also be present, since plugin IIFEs take it as their argument.

Note that plugin `dist/index.js` files contain bare ESM imports (`import { ParameterType } from 'jspsych'`), so they must be resolved by Vite at build time rather than loaded raw.

**jsPsych v6 is rejected at import.** v6 uses string plugin types, `jsPsych.init({timeline})`, `jsPsych.NO_KEYS`, and a different data shape. Half-supporting it is worse than not supporting it. Detect and fail with a message pointing at the official migration guide.

### 3.4 lab.js import

Nearly free. The lab.js builder exports `<title>-YYYY-MM-DD--HH:mm.study.json`, which is exactly the serialized component graph `lab.core.deserialize(options, libraryRoot)` consumes — the call `ExperimentWindow.tsx:40` already makes. Import is: file picker → `JSON.parse` → existing code path, with the same Markers-tab treatment for conditions.

---

## 4. Import flow

1. **Pick a file.** `FILE_TYPES.TIMELINE` through the existing `loadDialog` handler (`src/main/index.ts:168`), whose dialog title at line 187 already says *"Select a jsPsych timeline file"*. Accept `.js` (jsPsych) and `.study.json` (lab.js).
2. **Copy into the workspace** (decision 7).
3. **Optional asset folder.** Authorized through `StimulusFileAccess.authorizeDirectory()` (`src/main/stimulusFileAccess.ts:13`) and served over `bwfile://` (`src/main/index.ts:805`). Relative stimulus URLs in the timeline are rewritten to `bwfile://` at evaluation time using `toStimulusFileUrl` from `src/shared/stimulusUrl.ts`.
4. **Markers tab** — new, and shown only for imported experiments. A static scan of the `.js` surfaces `data:` object literals; the teacher chooses which key carries the condition (`condition`, `image_type`, `stim_type`, or whatever the author used) and confirms an ordered list of the string values found, adding any the scan missed on dynamic branches. Codes are assigned by that order and frozen into `appState.json`.
5. **No conditions declared** → the experiment still imports and runs, EEG is forced off, and the workspace proceeds in behavior-only mode.

### Why the Markers tab and not a scan alone

jsPsych has **no condition concept**. The `data` parameter is a free-form key-value bag; the official docs' own examples use `image_type: 'A'`, `condition: 'conditionA'`, and `subject`. `trial_type` holds the *plugin name*, so Face and House trials both rendered by `image-keyboard-response` are byte-identical there. There is no jsPsych-side string to pair against automatically — only the key that one particular author happened to choose. The tab is where that choice gets named once and frozen.

---

## 5. Contracts

### 5.1 Markers — no new abstraction needed

`eventCallback(code, time)` is already device-agnostic and numeric. `ImportedExperimentWindow` calls it exactly as `LabjsExperimentWindow` does; `RunComponent` fans out to `injectMarker` and `sendMarker` unchanged.

Timestamp handling is worth recording, because the two drivers differ:

- **Muse** honours the emitted timestamp. `synchronizeTimestamp` (`src/renderer/utils/eeg/muse.ts:179`) attaches a marker to the EEG sample falling within `INTER_SAMPLE_INTERVAL` (`muse.ts:27`, `-3.90625 ms` at 256 Hz) *before* the marker's own timestamp. Transport delay does not displace the marker, provided it arrives before that sample has flowed through the observable.
- **Neurosity** ignores the timestamp entirely (`src/renderer/utils/eeg/neurosity.ts:160`) and pins the marker to the next emitted sample, so any delay displaces it directly.

Same-realm execution (decision 2) makes both moot for v1, but the asymmetry constrains any future move to an isolated runtime.

### 5.2 The one genuine convergence point

`buildMarkerRegistry` gains a second constructor that takes the declared `{ label → code }` map directly, instead of deriving it from `params.stimuli`. This is not optional: `pyodideEpics.ts:194` reads `eventId` straight out of it to build MNE's `event_id`, and the events sidecar JSON written by the start epic uses `codeToLabel`.

### 5.3 Behavioral data

The imported runtime maps jsPsych-native fields onto the schema `compute.js` requires:

| BrainWaves column | Source |
|---|---|
| `trial_number` | `trial_index` — native, universal |
| `reaction_time` | `rt` — native to response plugins |
| `response_given` | derived: `rt !== null` → `'yes'` / `'no'` |
| `condition` | `data.<key>` — the key chosen in the Markers tab |
| `correct_response` | `data.correct`, or plugin-native `correct` on `categorize-*` |
| `phase` | `data.phase`; defaults to non-practice |

Only `correct_response` and `phase` depend on author convention. The rest is native or derived.

`onFinish` remains a CSV string in v1. The imported runtime builds typed rows internally and serializes through a shared, tested `toBehavioralCsv()`. Converting the lab.js path to typed rows as well is the correct end state — today the six required columns are enforced by nothing but habit — but it edits the P0 path that `TODOS.md:7` has awaiting click-through QA. Recorded here as a named follow-up, not silent debt.

---

## 6. Security posture

Decision 2 accepts that imported code shares a realm with `window.electronAPI` — including `deleteWorkspaceDir`, `writeCleanedEpochs`, and the LSL bridge — under a CSP that already permits `'unsafe-eval'` (`src/renderer/index.html:5-8`). The `bwfile://` allowlist exists specifically to gate disk access, and a raw import hands that back.

Component separation makes the exposure **auditable** — one file to review — but not **prevented**. This is a deliberate, informed v1 tradeoff, on the record, with the isolation upgrade path preserved by §3.1. See §9 for the one cheap mitigation worth testing.

---

## 7. Files touched

| Area | Change |
|---|---|
| `src/renderer/components/ExperimentWindow.tsx` | Rename to `LabjsExperimentWindow`; extract `ExperimentRuntimeProps`; internals unchanged |
| `src/renderer/components/ImportedExperimentWindow.tsx` | New — jsPsych host, `initJsPsych` wrapper, plugin globals, normalization |
| `src/renderer/components/ExperimentRuntime.tsx` | New — dispatcher on experiment type |
| `src/renderer/constants/constants.ts` | New `EXPERIMENTS` variant for imported studies; keep `CUSTOM = 'Custom'` intact |
| `src/renderer/utils/labjs/functions.ts` | `getExperimentFromType` handles the new variant |
| `src/renderer/utils/eeg/markerRegistry.ts` | Second constructor from a declared label→code map |
| `src/renderer/components/HomeComponent/index.tsx` | Import card; relabel Custom → "Experiment Builder" |
| `src/renderer/components/DesignComponent/` | Markers tab, imported-only |
| `src/renderer/reducers/experimentReducer.ts` | Persist condition map, condition key, imported file path |
| `src/renderer/epics/experimentEpics.ts` | Workspace creation copies the imported file |
| `src/main/index.ts` | Wire the existing `FILE_TYPES.TIMELINE` branch to a real caller |
| `src/renderer/app.global.css` | Keep and own the existing `.jspsych-*` rules; add `jspsych.css` |
| `package.json` | `jspsych@8.3.0` + 53 official plugin packages |

---

## 8. Verification

**Unit**
- String→code interning is stable given the same declared order, and independent of encounter order.
- Behavioral normalization produces every required column from a representative jsPsych `DataCollection`.
- `toBehavioralCsv` output parses back through `Papa.parse` into rows `compute.js` accepts.
- v6 detection rejects `jsPsych.init(...)` and string `type:` values with an actionable message.
- A missing plugin global is named explicitly at import rather than dying mid-run with a bare `ReferenceError`.

**Integration**
- Import a real third-party jsPsych experiment, confirm Preview renders, then run Collect against the replay/fixture `EEGDriver` from `TODOS.md:10` — which this feature gives a second reason to build — and confirm non-zero codes reach the `Marker` column and epochs come back non-empty.
- Import a lab.js `.study.json` exported from the lab.js builder and confirm it reaches the same place.

**Hardware**
- Muse ERP end to end, in the packaged app (not dev), with the `on_trial_start` + `requestAnimationFrame` offset **measured** against the Muse sample clock rather than assumed.
- Confirm WebAudio is live under `file://` with `override_safe_mode: true`.

---

## 9. Open questions

- **Can `contextBridge` properties be deleted or shadowed for the duration of an imported run?** If yes, it is a cheap partial mitigation for §6. Not promised until tested — `exposeInMainWorld` may define non-configurable properties, and an experiment could capture a reference before any teardown.
- **What is the true offset between `on_trial_start` + rAF and physical stimulus onset?** Needs a photodiode or Muse sample-clock measurement. Everything in §3.2 about this ordering is inference.

---

## 10. Out of scope for v1

`@jspsych-contrib` packages (~55); `jspsych-builder` bundle imports; jsPsych v6; extensions beyond a case-by-case list; in-app timeline authoring or editing; process or realm isolation for imported code; normalizing the lab.js path to typed behavioral rows.
