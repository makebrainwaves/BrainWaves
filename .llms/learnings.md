# BrainWaves — Codebase Learnings

Accumulated insights from agents and developers working on this codebase.
Add entries here when you discover something non-obvious — gotchas, hidden dependencies, tricky patterns, debugging tips.

For the hard seams (Electron IPC, Pyodide/MNE, redux-observable epochs, CDP playtesting), the `.claude/skills/` files are the task-oriented source of truth. This file keeps a short reminder for those topics instead of duplicating the full skill, so duplicated guidance is not loaded into every conversation.

Format: brief heading + explanation + (optional) relevant file paths.

---

<!-- Add entries below this line -->

## jsPsych v8 is a supported runtime alongside lab.js

BrainWaves now runs externally-authored jsPsych v8 timelines (`.js`) and lab.js `.study.json` files. The runtime is implemented in `src/renderer/components/ImportedExperimentWindow.tsx`, which owns the `initJsPsych()` call and injects `display_element`, `override_safe_mode`, marker emission via `on_trial_start` + `requestAnimationFrame`, and behavioral CSV normalization. All 52 official `@jspsych/plugin-*` packages ship in the bundle; missing plugins are a hard classroom failure, so the full set is included despite bundle size (~9 MB against an already-shipping Pyodide runtime). Condition labels are declared by the teacher in a Markers tab (not auto-derived) because randomization and timeline variables make the true set statically unknowable. Numeric codes come from the declared label order: `conditionLabels[i]` → code `i + 1`. An empty label list is a legitimate behavior-only state (EEG forced off). See `docs/superpowers/specs/2026-08-21-import-experiments-design.md` for full architecture decisions.

## Comment style: keep them on definitions, not inside logic

This repo prefers minimal comments. Write them on **function, prop, or data-structure
definitions** (docstrings / JSDoc, a one-liner over a type field, an interface member) —
they describe intent and behavior that outlives the implementation. Avoid comments
*inside* function bodies that narrate the process step-by-step, restate the code, or
tag "Phase N"/PR history; that knowledge belongs in the definition's summary, the
relevant skill (e.g. the pyodide skill), or git history. A component's top-of-file
comment should concisely state what it is and does — not a diagram of every branch.

## Markers: device-agnostic injection and numeric-code contract

EEG marker injection now flows through the shared `EEGDriver` interface, and marker codes
must stay aligned between collection and MNE analysis. See `skill://redux-observable-epochs`.

## Testing the analysis pipeline against native MNE (no Pyodide)

`webworker/utils.py` is testable outside Pyodide; the in-app analysis and `tests/analysis/`
share one implementation. See `skill://pyodide-mne`.

## Testing device + LSL connectivity without native deps

Device and LSL paths are mock-tested so CI needs no liblsl / koffi / SDK installed.
See `skill://electron-ipc-architecture`.

## Styling System (post Phase 4 migration)

The app uses shadcn/ui + Tailwind CSS. CSS modules have been fully removed. Key conventions:
- **Brand color**: `bg-brand` / `text-brand` (teal `#007c70`) — defined in `tailwind.config.js`
- **Accent color**: `border-accent` (gold `#ffc107`) — used for nav active/visited underline indicators
- **Signal quality colors**: `text-signal-great/ok/bad/none` — defined in Tailwind config
- **shadcn components** in `src/renderer/components/ui/`: Button, Card, Dialog, DropdownMenu, Table, Select, Badge, utils
- **Multi-selects** (`<select multiple>`) use styled native HTML elements since shadcn Select doesn't support multi-select
- **Nav state**: `PrimaryNavSegment` accepts `status: 'active' | 'visited' | 'initial'` (not CSS class strings); `SecondaryNavSegment` accepts `active: boolean`
- **Background gradient** used on all main screens: `bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]`
- **`@radix-ui/react-select`** is installed for the shadcn Select component

## Pyodide asset loading, offline packages, and plot routing

Custom `pyodide://` protocol handling, `InstallMNE.mjs`, wheel installation via Emscripten FS,
plot routing through the worker, and the `indexURL`/`packageBaseUrl` requirements are all
covered in `skill://pyodide-mne`.

## Lab.js 23.x API: `hooks` replaces `messageHandlers`

Lab.js 23.x renamed the event-handler registration option from `messageHandlers` to `hooks`. The experiment JSON files (e.g. `experiment.ts` in each experiment folder) must use `hooks:` not `messageHandlers:` for before:prepare/run/end callbacks. If `messageHandlers` is used, the handlers are silently ignored — loops won't initialize their `templateParameters`, causing "Empty or invalid parameter set for loop, no content generated".

Affected files: `src/renderer/experiments/*/experiment.ts` (and `custom/experiment.js`). The format is identical — just the key name changed:
```js
// Old (lab.js < 22): messageHandlers: { 'before:prepare': initLoopWithStimuli }
// New (lab.js 23.x): hooks: { 'before:prepare': initLoopWithStimuli }
```

## Lab.js 23.x: datastore moved to `global.datastore` (not `options.datastore`)

Reading the experiment's recorded data at flow end must use
`study.global.datastore` (a getter → `controller.global.datastore`, used
throughout lab.js internals: `base/component.ts` set/commit/update). Lab.js
23.x removed `study.options.datastore` — it's `undefined`. The old path in
`ExperimentWindow.tsx`'s `on('end')` handler (`options.datastore.exportCsv()`)
threw *inside* lab.js's end sequence: `stopOutgoing` (`flipIterable.ts`) logs
`console.error('Error ending', c)` and **re-throws**, so a throw in our end
handler aborts the whole end/commit — the surfaced error is misleadingly the
component dump, not the real TypeError. Side effect: the aborted end left
`appState.json` half-written, which then read back as a "corrupted workspace".
Same 23.x major-bump breakage class as `hooks`/`this.id` — audit any other
`study.options.*` access.

## Lab.js stimulus `filepath` must be a browser URL, not a filesystem path

`balanceStimuliByCondition` (in `src/renderer/utils/labjs/functions.ts`) generates a `filepath` field used by lab.js HTML templates (`<img src="${ this.parameters.filepath }">`). This must be a browser-loadable URL, not a raw filesystem path like `/Users/.../Face1.jpg`.

In dev: use `/@fs<absPath>` (Vite's `/@fs/` serving). In prod: use `file://<absPath>`. The helper `absPathToUrl` in `functions.ts` handles this. Same pattern as `ExperimentWindow.tsx` for `options.media.images`.

## Lab.js: `this.id` vs `this.options.id` for loop-cloned components

`prepareNested` (in `flow/util/nested.js`) sets IDs on cloned loop components via `c.id = [parent.id, i].join('_')` — this sets the **component's own property**, NOT `c.options.id`. The options proxy reads through `rawOptions`, which never has an `id` for template-cloned components (the JSON template has no explicit `id` field).

Any hook function (e.g. `initResponseHandlers` in `src/renderer/utils/labjs/functions.ts`) that needs the component ID must use `this.id`, not `this.options.id`. Using `this.options.id` will always be `undefined` for loop-cloned components, causing silent early returns and broken behavior (e.g. keydown handlers never installed).

## liblsl on Apple Silicon and LSL lazy-loading

The Apple Silicon dylib problem and the requirement to load `node-labstreaminglayer`
lazily (so missing liblsl does not crash Muse-only users on launch) are covered in
`skill://electron-ipc-architecture`.

## electron-builder skips publishing (exit 0) when releaseType ≠ the existing release

`build.publish.releaseType` must match what already exists at the tag. With
`releaseType: "draft"` and an already-**published** GitHub release at that tag,
electron-builder logs `GitHub release not created reason=existing type not compatible
with publishing type … existingType=release publishingType=draft`, then `skipped
publishing` for every artifact — and **exits 0**, so the Release workflow goes green
while uploading nothing. Users keep downloading whatever binaries were attached before.

That is how issue #239 happened: v1.0.0's assets were a March build, five months older
than the tag, so they predated `2197925 fix: pyodide asset resolution in packaged
builds`. Symptom was a Pyodide error, cause was the release pipeline. Set to
`"release"` so re-tagging over a published release is compatible. When a release
looks wrong, check asset `created_at` against the tag date before debugging the app:
`gh api repos/OWNER/REPO/releases/tags/TAG --jq '.assets[] | "\(.name) \(.created_at)"'`

## macOS "BrainWaves is damaged" = unsigned bundle + quarantine, not a build bug

Release CI has no Apple signing cert, so the macOS job logs `skipped macOS
application code signing reason=cannot find valid "Developer ID Application"
identity … 0 identities found` and ships an unsigned `.app`. Downloaded via a
browser it carries `com.apple.quarantine`, and Gatekeeper's message for a
quarantined bundle that is neither Developer-ID-signed nor notarized is
**"is damaged and can't be opened"** — misleading, since nothing is corrupt.
Right-click → Open does not bypass it; only `xattr -dr com.apple.quarantine`
does (documented in README "Installing"). Signed-but-not-notarized would instead
say "developer cannot be verified", so the wording tells you which state you're in.

Separately, arm64 enforces code signing at *exec* time, so an unsigned bundle can
die on launch even after quarantine is stripped. `afterPack.mjs` therefore ad-hoc
signs (`codesign --force --deep --sign -`) and verifies the whole `.app` after the
liblsl rewrite — that ordering matters, since `app.asar.unpacked` is inside the
seal. Ad-hoc signing does *not* appease Gatekeeper; only Developer ID + notarization
removes the xattr step. When a real identity is added, electron-builder's signing
step runs after this hook and supersedes the ad-hoc signature.

Check the CI log before debugging the app: `gh run view <id> --log | grep -i sign`.

## Behavior data: booleans become strings after the CSV round-trip

Experiments emit `this.data.correct_response` as a real boolean (`true`/`false`) and `response_given` as `'yes'`/`'no'` (see `src/renderer/utils/labjs/functions.ts`). But all consumers in `src/renderer/utils/behavior/compute.js` read data **after** it's been written to CSV and re-parsed, so every value is a **string**. That's why existing code gates on `row.correct_response === 'true'` and `row.response_given === 'yes'`, and parses numbers with `parseFloat`.

Trap: a new metric written naively (`row.correct_response === true`, or arithmetic on an unparsed string) will silently return `false`/`0`/`NaN` for post-CSV data — and may *work* on pre-CSV in-memory data, so it passes a quick test and fails in production. Always compare against the string `'true'`/`'yes'` and `parseFloat` before doing math.

## Playtest the Electron window, never Vite `:5173`

The only valid automated QA is the CDP-attached Electron smoke test. Vite
`:5173` has no preload and fails immediately. See `skill://electron-playtest` for
the smoke-test command and CI usage.

## Custom experiments are a V1 P0 restore, not a delete

The 2017–2020 app had a working custom-experiment builder (CHANGELOG 0.11–0.13).
HEAD still has the files (`CustomDesignComponent`, `StimuliRow`/`StimuliDesignColumn`,
`experiments/custom/`) but the bank has no Custom card, `getExperimentFromType`
falls through to Faces/Houses, and CONDITIONS/TRIALS are stubbed. Recover from
git history; do not delete the stub. See `TODOS.md`.

## Lab.js content templates are lodash `template` — full JS, `this` = parameter context

`lab.core.deserialize` parses `${...}` placeholders in `content`/`timeout`/etc.
via lodash `template` (see `lab.js/dist/es2022/base/util/options.js`: `template(raw,
{ escape: '', evaluate: '' }).call(that, context)` where the context/`that` carry
`parameters`, `state`, `files`, `random`). So arbitrary JS expressions work —
ternaries, string concat, `this.parameters.x` — and an expression can emit whole
HTML tags (screens insert content via innerHTML). The custom experiment template
(`experiments/custom/experiment.ts`) uses this to render `<img>`/`<audio autoplay>`
conditionally per trial. When authoring these in TS template literals, escape the
placeholders as `\${`, or TS will evaluate them at module load. Sounds for stimuli
need `media-src bwfile:` in the CSP (and `connect-src` for lab.js's fetch-based
audio preload into `options.media.audio`).

## `lab.css` styles bare `<main>`/`<header>` — Tailwind utilities lose to it

`app.global.css` imports `lab.js/dist/css/lab.css` into `layer(vendor-experiment)`
so experiment styling can't leak into app chrome. That containment is incomplete:
lab.css sets `header, footer, main { padding: 24px; text-align: center }`, and any
app UI built on semantic `<main>`/`<header>` silently inherits centered text and
24px padding. `className="text-left"` does **not** reliably win.

Symptom: a left-aligned design renders centered with mystery padding, while the
utility class is present in the DOM. Confirm by walking `document.styleSheets` for
rules matching the node (drive the Electron window per the `electron-playtest`
skill) — `header, footer, main` shows up as the winning rule.

Fix used by the Experiment Design screen: scoped classes in `app.global.css`
(`.experiment-design-content` and `.experiment-design-content header`) that reset
`padding`/`text-align`. Do not reach for `!important`, and do not un-layer lab.css.
The same trap covers body copy — global `p { font-size: 18px !important }` is why
the redesign's 19px/17px text uses `.experiment-design-copy` /
`.experiment-design-card-copy` instead of Tailwind text utilities.

Note: `.llms/learnings.md` is not Prettier-formatted; running `prettier --write` on
it rewraps unrelated entries. Append by hand.

## EEGViewer: four traps behind the "broken live plot" reports

All four surfaced in one Explore playtest and all live in
`src/renderer/components/d3Classes/EEGViewer.js`:

- **Never seed a wall-clock data point.** `resetData()` used to push
  `{ x: Date.now(), y: 0 }`. `ViewerComponent` sends `updateSnapshot(null)` to
  every live guest as soon as it is ready, so every live plot got that point —
  and because device timestamps lag `Date.now()` (a backgrounded renderer
  throttles the fixture's `setInterval` to ~1 Hz, so the stream clock can trail
  by a minute), it survived window pruning and drew a straight line from far
  right back to the trace, looking like an unclosed SVG path.
- **The x axis shows offsets, so it needs its own scale.** Rebuilding a
  `scaleTime` axis from absolute timestamps on every 250 ms epoch made "-4s"
  labels visibly jitter. There is now a separate `xAxisScale` (linear,
  `[-domain, 0]`) redrawn only by `renderTimeAxis()` on geometry/domain change,
  with explicit whole-second `tickValues` — `.ticks(n)` picked 500 ms steps that
  rounded to duplicate labels ("-4s -4s -3s -3s").
- **`rx: 999` is not a pill.** SVG clamps `rx` to half the box, so a 22 px-tall
  annotation label rendered as an oval. Use `LABEL_RADIUS = LABEL_HEIGHT / 2`.
  The annotation clip-path must also extend `LABEL_GUTTER` above and below the
  plot box, or the end label (drawn at `plotHeight + 6`) is clipped away.
- **Data arrives at 4 Hz; motion does not have to.** `PLOTTING_INTERVAL` is
  250 ms and is load-bearing for the filter/signal-quality windows, so do not
  lower it to make the plot smoother. `slideIn()` instead offsets the line and
  annotation groups by the new epoch's pixel width and animates them back to
  zero over that interval (skipped for reduced motion or a time discontinuity).

Related: viewer replay. A newly mounted guest only ever draws what the shared
observable replays, so `EEGExplorationComponent` uses
`shareReplay({ bufferSize: domain / PLOTTING_INTERVAL })` — with `bufferSize: 1`
a lesson plot started as a 250 ms sliver in an empty five-second window.

## Root font-size is 18px, so every rem-based Tailwind utility is 1.125× larger

`lab.css` (imported layered, but nothing else sets `:root` font-size) sets
`:root { font-size: 18px }`. Tailwind spacing/type utilities are rem-based, so in
the app *and* Storybook `text-sm` is 15.75px, `px-4` is 18px, `h-16` is 72px.
Design handoffs are specced at a 16px root. When a handoff gives exact px (e.g. the
64px shell bar, 1180px min width), use arbitrary px utilities (`h-[64px]`,
`text-[14px]`) — the `AppShell/` and `HomeLanding/` components do. shadcn `Button`
stays rem-based. Confirm with `getComputedStyle(el).padding` in the canvas.

## Design-sync token comments need an uncompiled CSS entry

Storybook's Vite build strips `/*! @kind ... */` comments from imported CSS, so
the compiled iframe stylesheet cannot carry token typing metadata by itself.
BrainWaves keeps canonical values in `src/renderer/tokens.css`; design-sync copies
that file through `cfg.cssEntry`, then
`.design-sync/overrides/css-fallback.mjs` appends Storybook's compiled CSS so
component styles still ship. Token collection must exclude
`@layer vendor-experiment`, all `react-toastify` CSS, and `--tw-*`.

## AppShell is the only global chrome; routes live in one map

`containers/App.tsx` wraps every route in `containers/AppShellContainer.tsx`, which
is the single place Redux state becomes shell props (workspace identity, device
chip, workflow areas, run bar). The old global `TopNavComponent` /
`TopNavBarContainer` are gone; per-screen `SecondaryNavComponent` tab bars stay.

Route knowledge is centralized in `components/AppShell/areas.ts`: `AREA_ROUTES`
(prepare→/design, collect→/collect, clean→/clean, analyze→/analyze), `areaForPath`,
and `isWorkspaceRoute`. The save/cleanup epics in `experimentEpics.ts` gate on
`isWorkspaceRoute` rather than hardcoded `'/'`/`'/home'` strings — that is what
keeps `/explore` (live view, no workspace) from triggering `SaveWorkspace` or
resurrecting state. Any new non-workspace route works automatically; any new area
must be added to `AREA_ROUTES` and `WorkflowNav`'s `AREAS`.

Home is now three routes: `/` (`HomeLanding` via `HomeScreen`), `/home` (experiment
bank only) and `/explore` (live EEG). `PyodideActions.Launch()` fires once from
`HomeScreen`, the app's entry screen — it is no longer in the bank component.

## `getBehavioralCsvs` is dead in the renderer — no preload bridge exists

`utils/filesystem/storage.ts` exports `getBehavioralCsvs`, but there is no matching
`ipcMain` handler or preload method, so calling it rejects. Use
`readWorkspaceBehaviorData(title)` (`fs:readWorkspaceBehaviorData`), which returns
`{name,path}[]` and already swallows ENOENT in main. `useWorkspaceProgress` (shell
badges + `Next →`) uses it alongside `readWorkspaceRawEEGData` /
`readWorkspaceCleanedEEGData`.

## `npm test` collects sibling git worktrees unless excluded

A `.worktrees/<branch>/` checkout carries its own `node_modules`, so Vitest
collected every test twice and the duplicate copies failed with
`Cannot read properties of null (reading 'useState')` — two React instances, not a
real regression. `vitest.config.ts` now sets an explicit `exclude` containing
`**/.worktrees/**`. If a mass failure appears only in paths starting `.worktrees/`,
it is collection scope, not code.
