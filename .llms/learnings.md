# BrainWaves — Codebase Learnings

Accumulated insights from agents and developers working on this codebase.
Add entries here when you discover something non-obvious — gotchas, hidden dependencies, tricky patterns, debugging tips.

Format: brief heading + explanation + (optional) relevant file paths.

---

<!-- Add entries below this line -->

## Markers: device-agnostic injection via the EEGDriver interface

Marker injection used to be Muse-only and lived in the UI (`RunComponent.eventCallback`
called `injectMuseMarker` directly). Neurosity recordings therefore had an all-zero
Marker column and could not yield ERPs. Now every first-party backend implements a
shared `EEGDriver` interface (`src/renderer/utils/eeg/types.ts`) with `injectMarker`,
registered in `src/renderer/utils/eeg/index.ts`. `deviceEpics` resolves drivers via
`getDriver(deviceType)` instead of branching on MUSE/NEUROSITY, and the UI calls the
device-agnostic `injectMarker()` dispatcher (delegates to the active driver, set on
connect via `setActiveDriver`). A new device cannot ship without a marker path — the
interface won't compile without it. LSL inlet is intentionally NOT in the registry
(separate external-recorder mode; `injectMarker` no-ops for it). Neurosity has no
native marker stream, so its `injectMarker` attaches the code to the next emitted
sample (one epoch of latency); Muse merges via muse-js eventMarkers + `synchronizeTimestamp`.

## Marker codes are numeric, and the analysis event_id must match them

Markers passed to `callbackForEEG` (and into the CSV) are **numeric** EVENTS codes
(`stimulus.type`, e.g. STIMULUS_1 = 1), not strings — see the experiment files'
`callbackForEEG(this.parameters.congruent === 'yes' ? 1 : 2)` etc. The CSV Marker
column carries these codes; MNE `find_events` reads them off the last (`stim`) channel.
The bug: `pyodideEpics.loadEpochsEpic` built the MNE `event_id` map as
`{stimulus.title: arrayIndex}` (0-based), which did not match the 1-based codes in the
data — so code-2 epochs matched no event_id and MNE raised "No matching events". Fixed
by `buildMarkerRegistry` (`src/renderer/utils/eeg/markerRegistry.ts`), the single source
of truth used by BOTH collection (CSV codes + `-events.json` sidecar) and analysis
(event_id). Also a latent bug: `epochEvents` interpolated an undefined `reject` as
`reject = undefined` (Python NameError) — now coerced to `None`.

## Testing the analysis pipeline against native MNE (no Pyodide)

`webworker/utils.py` is testable outside Pyodide: `load_data(csv_strings=...)` skips the
`js.csvArray` global, and epoching is factored into `get_raw_epochs(raw, event_id,
tmin, tmax, ...)` which `webworker/index.ts` `epochEvents` also calls — so the in-app
analysis and the tests share one implementation (no drift). `tests/analysis/` runs the
real `utils.py` against native MNE via pytest (`conftest.py` puts the webworker dir on
`sys.path`; `MPLBACKEND=agg` because utils.py imports pyplot at module load). The golden
test (`test_erp_roundtrip.py` + `synthetic.py`) plants a P300-like bump on one condition
and asserts it's recovered after `load_data → filter(1,30,'iir') → get_raw_epochs →
average`, plus sfreq-under-jitter and dropped-sample cases. CI: `.github/workflows/
analysis.yml` (Python job, `pip install -r tests/analysis/requirements.txt`). The app
runs the same Python under Pyodide/WASM — a Pyodide-fidelity smoke job is still a TODO.

## Testing device + LSL connectivity without native deps

Device/LSL connectivity is integration-tested with the native layers fully mocked, so the tests run anywhere (incl. CI on all OSes) with **no liblsl / koffi / SDK installed**:
- `src/main/lsl/__tests__/fakeLslNetwork.ts` — an in-memory fake of `node-labstreaminglayer`: creating a `StreamOutlet` registers its `StreamInfo` on a shared broker; `resolveStreams()` lists live outlets; a `StreamInlet`'s `pullChunk()` reads what its outlet pushed since the last pull. This lets `outlets.ts` → `inlets.ts` be tested as a real round trip. Inject it by `vi.mock('../native')` then `vi.mocked(loadLSL).mockReturnValue(fake.module as unknown as ...)`. `outlets.ts`/`inlets.ts` also import `electron-log`, so `vi.mock('electron-log', () => ({ default: { info/warn/error: vi.fn() } }))` is required. The inlet poll loop is a `setInterval`, so use `vi.useFakeTimers()` + `vi.advanceTimersByTime()`.
- Renderer drivers mock `window.electronAPI` (capture the `onLSLInletData`/`onLSLInletDisconnected` handlers to "push" inlet epochs) and `@neurosity/sdk`. The Neurosity mock's `Neurosity` must be `new`-able — `neurosity.ts` does `new Neurosity(...)` — so define a plain `function Neurosity(){ return client }` inside `vi.hoisted` (arrow fns aren't constructable) and `vi.mock('@neurosity/sdk', () => ({ Neurosity: h.Neurosity }))`.
- `lslBridge.ts` probes availability at module load via a top-level `isLSLAvailable()` promise; to test the gate, set `window.electronAPI.isLSLAvailable` before `vi.resetModules()` + dynamic `await import('../lslBridge')`, then flush a microtask.

**CI**: `npm run device-integration` (script targets `src/main/lsl src/renderer/utils/eeg`) runs as its own `.github/workflows/integration.yml` job with `npm ci --ignore-scripts` — since every native module is mocked, it skips the slow Pyodide/MNE postinstall and needs no liblsl. The full cross-OS suite still runs these too via `npm test` in `test.yml` (whose `Test` step runs before the lint step).

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

## Pyodide Asset Serving — Custom `pyodide://` Protocol

Vite's `historyApiFallback` returns `index.html` for **all** `fetch()` requests from web workers, breaking Pyodide's package loading. We solved this with a custom Electron protocol scheme registered in `src/main/index.ts` (`protocol.handle('pyodide', ...)`). The web worker uses `pyodide://host` as `PYODIDE_ASSET_BASE` and the handler resolves paths against the local filesystem — no HTTP socket required, works identically in dev and prod.

**Filesystem roots resolved by the handler:**
- Dev: `src/renderer/utils/webworker/src/`
- Prod: `process.resourcesPath/pyodide/` — `package.json` `extraResources` copies `webworker/src/` to a folder named `pyodide`. The protocol handler must match this destination name (mismatched once and broke prod entirely).

**`indexURL` is required in prod, not just `packageBaseUrl`.** In dev, `pyodide.mjs` is imported via Vite's `?url` from `node_modules/pyodide/`, and the runtime files (`pyodide.asm.wasm`, `python_stdlib.zip`) load via `import.meta.url`-relative fetch — siblings live alongside it in node_modules. In prod, Vite bundles `pyodide.mjs` into `out/renderer/assets/` *without* its siblings, so `import.meta.url` resolution fails. Setting `indexURL: '${PYODIDE_ASSET_BASE}/pyodide/'` routes runtime fetches through the protocol handler. Set both `packageBaseUrl` (for `.whl` files via `loadPackage`) and `indexURL` (for the runtime).

**Other Pyodide loading gotchas:**
- `pyodide.mjs` must be loaded via dynamic `import()` (not `fetch()`), using a `?url` Vite import — `import()` bypasses the SPA fallback, `fetch()` does not
- The lock file is embedded via `?raw` and wrapped in a `Blob` + `createObjectURL` to avoid an HTTP fetch
- `checkIntegrity: false` is required — SHA256 hashes in the npm lock file don't match CDN-downloaded wheels
- Workers must be created with `type: 'module'` (Pyodide 0.26+ ships `pyodide.mjs` as ESM)
- `optimizeDeps.exclude: ['pyodide']` in `vite.config.ts` prevents Vite from pre-bundling it
- `micropip.install()` only accepts `http://`, `https://`, `emfs://`, and relative paths — it rejects custom schemes like `pyodide://`. Workaround: JS-fetch each `.whl` via the protocol handler, write into Pyodide's emscripten FS at `/tmp/`, then install via `emfs:///tmp/...`.

## Pyodide Offline Package Installation (InstallMNE.mjs)

`internals/scripts/InstallMNE.mjs` runs on `postinstall` and downloads two sets of packages:
- **Pyodide binary packages** (numpy, scipy, matplotlib, pandas + transitive deps) from the Pyodide CDN → `src/renderer/utils/webworker/src/pyodide/`
- **Pure-Python packages** (mne, pooch, tqdm, platformdirs) from PyPI → `src/renderer/utils/webworker/src/packages/`

A `manifest.json` is written to `packages/` so `webworker.js` knows the exact `.whl` filenames to pass to `micropip.install()`.

The CDN version is derived from `node_modules/pyodide/package.json` — **not** from `pyodide-lock.json`'s `info.version`, which may be a dev label like `0.28.0.dev0`.

**Packages that must be listed explicitly** (not reachable from matplotlib/scipy/pandas deps in the lock file, but required at runtime):
- `jinja2` + `markupsafe` — used by matplotlib templates and MNE HTML reports
- `decorator` — MNE core dep
- `requests` (+ `certifi`, `charset-normalizer`, `idna`, `urllib3`) — pulled in by `pooch` at MNE import time

**`micropip.install()` from JS accepts a JS array directly** — as of Pyodide 0.29.x, micropip handles the `JsProxy` conversion internally. `pyodide.toPy()` is not needed.

**WebAgg backend does not work in web workers** — WebAgg tries to access `js.document` to inject CSS/JS into the DOM on first import, which throws `ImportError: cannot import name 'document' from 'js'` in a worker context. Use `agg` instead. Set it via `os.environ["MPLBACKEND"] = "agg"` before any matplotlib import. `fig.savefig()` works with `agg` and is the correct way to get plot images back to the renderer.

**Plot result routing pattern** — `worker.postMessage()` is fire-and-forget (returns `undefined`). Plot epics should use `tap()` to fire the worker message and `mergeMap(() => EMPTY)` to emit nothing. Results come back asynchronously on the worker `message` event. Add a `plotKey` field to each worker message; the worker echoes it back; `pyodideMessageEpic` switches on `plotKey` to dispatch `SetTopoPlot`/`SetPSDPlot`/`SetERPPlot` with a `{ 'image/png': base64string }` MIME bundle. `PyodidePlotWidget` renders this via `@nteract/transforms`.

## Lab.js 23.x API: `hooks` replaces `messageHandlers`

Lab.js 23.x renamed the event-handler registration option from `messageHandlers` to `hooks`. The experiment JSON files (e.g. `experiment.ts` in each experiment folder) must use `hooks:` not `messageHandlers:` for before:prepare/run/end callbacks. If `messageHandlers` is used, the handlers are silently ignored — loops won't initialize their `templateParameters`, causing "Empty or invalid parameter set for loop, no content generated".

Affected files: `src/renderer/experiments/*/experiment.ts` (and `custom/experiment.js`). The format is identical — just the key name changed:
```js
// Old (lab.js < 22): messageHandlers: { 'before:prepare': initLoopWithStimuli }
// New (lab.js 23.x): hooks: { 'before:prepare': initLoopWithStimuli }
```

## Lab.js stimulus `filepath` must be a browser URL, not a filesystem path

`balanceStimuliByCondition` (in `src/renderer/utils/labjs/functions.ts`) generates a `filepath` field used by lab.js HTML templates (`<img src="${ this.parameters.filepath }">`). This must be a browser-loadable URL, not a raw filesystem path like `/Users/.../Face1.jpg`.

In dev: use `/@fs<absPath>` (Vite's `/@fs/` serving). In prod: use `file://<absPath>`. The helper `absPathToUrl` in `functions.ts` handles this. Same pattern as `ExperimentWindow.tsx` for `options.media.images`.

## Lab.js: `this.id` vs `this.options.id` for loop-cloned components

`prepareNested` (in `flow/util/nested.js`) sets IDs on cloned loop components via `c.id = [parent.id, i].join('_')` — this sets the **component's own property**, NOT `c.options.id`. The options proxy reads through `rawOptions`, which never has an `id` for template-cloned components (the JSON template has no explicit `id` field).

Any hook function (e.g. `initResponseHandlers` in `src/renderer/utils/labjs/functions.ts`) that needs the component ID must use `this.id`, not `this.options.id`. Using `this.options.id` will always be `undefined` for loop-cloned components, causing silent early returns and broken behavior (e.g. keydown handlers never installed).
## liblsl on Apple Silicon

`node-labstreaminglayer@0.3.0` ships only an **x86_64** `liblsl.dylib` in its `prebuild/` directory — the package has no arm64 build and was last updated 2025-08. Loading it on Apple Silicon throws `Failed to load shared library: ... (mach-o file, but is an incompatible architecture)`.

**Fix**: install liblsl via Homebrew (`brew install labstreaminglayer/tap/lsl`), then `internals/scripts/patchDeps.mjs` symlinks `/opt/homebrew/Cellar/lsl/<version>/Frameworks/lsl.framework/Versions/A/lsl` over the bundled x86_64 dylib on every install/dev run. The patch is a no-op on x86_64 macs and on Linux/Windows (which ship usable `.so`/`.dll` in the same prebuild dir).

Alternatives evaluated and rejected: `@neurodevs/node-lsl` and `@neurodevs/ndx-native` both require the same Homebrew install (they hard-code `/opt/homebrew/Cellar/lsl/...` paths) and have a much different async/worker-thread API that would force a substantial rewrite.

**Packaging follow-on (arm64): the Homebrew liblsl is NOT self-contained.** electron-builder *dereferences* the patchDeps symlink at package time, so the packaged `liblsl.dylib` is a real arm64 file (good) — BUT the Homebrew build dynamically links `/opt/homebrew/opt/pugixml/lib/libpugixml.1.dylib`, an absolute path absent on any clean Mac, so `dlopen(liblsl)` fails in distributed builds. `otool -L` on the packaged dylib is how you catch this. Fix: `internals/scripts/afterPack.mjs` (wired via `build.afterPack`) copies each external (`/opt/homebrew`, `/usr/local`, `/opt/local`) dep next to liblsl in `app.asar.unpacked/.../prebuild/` and `install_name_tool -change`s the refs to `@loader_path`, then re-signs ad-hoc (install_name_tool invalidates the signature; **arm64 dlopen requires a valid signature**). Verify a packaged build with: `otool -L` shows only `@loader_path` + `/usr/lib`, `codesign --verify` passes, and a `process.dlopen` of the dylib fails with "Module did not self-register" (loader resolved all deps) rather than "Library not loaded: /opt/homebrew/…".

## LSL is optional — load the native module lazily, never statically

`node-labstreaminglayer` `dlopen`s liblsl via koffi **at require time**. A static `import … from 'node-labstreaminglayer'` in the main process therefore runs that dlopen during module evaluation at startup — so a missing/incompatible liblsl (e.g. Apple Silicon without the Homebrew build) crashes the *entire app* on launch, even for Muse-only users who don't need LSL at all.

LSL is an advanced, opt-in capability: Muse and Neurosity connect via Web Bluetooth and record to CSV without it. So the native module must load lazily and fail soft:
- `src/main/lsl/native.ts` does a guarded `require('node-labstreaminglayer')` in try/catch (memoized), exposing `loadLSL()` (module | null) and `isLSLAvailable()`. `outlets.ts`/`inlets.ts` use **type-only** imports + `loadLSL()` at call time, no-opping when null.
- Feature-detect in the renderer via the `lsl:isAvailable` IPC: `ConnectModal` hides the "External LSL stream" option and `lslBridge` no-ops `sendEpoch`/`sendMarker` when unavailable (avoids IPC spam from first-party devices).

Build note: with `module: ESNext` source but CommonJS main output, a guarded `require(...)` of an externalized dep type-checks (global `require` from `@types/node`) and stays a `require` in `out/main/index.js` (electron-vite externalizes it) — confirmed lazy, not bundled. Do **not** revert to a static import.

## Behavior data: booleans become strings after the CSV round-trip

Experiments emit `this.data.correct_response` as a real boolean (`true`/`false`) and `response_given` as `'yes'`/`'no'` (see `src/renderer/utils/labjs/functions.ts`). But all consumers in `src/renderer/utils/behavior/compute.js` read data **after** it's been written to CSV and re-parsed, so every value is a **string**. That's why existing code gates on `row.correct_response === 'true'` and `row.response_given === 'yes'`, and parses numbers with `parseFloat`.

Trap: a new metric written naively (`row.correct_response === true`, or arithmetic on an unparsed string) will silently return `false`/`0`/`NaN` for post-CSV data — and may *work* on pre-CSV in-memory data, so it passes a quick test and fails in production. Always compare against the string `'true'`/`'yes'` and `parseFloat` before doing math.

## Pre-existing TypeScript errors (do not treat as regressions)

- `src/renderer/epics/experimentEpics.ts` (lines 170, 205) — RxJS operator type mismatch
- `src/renderer/routes.tsx` (lines 15-17) — Redux container component prop types
