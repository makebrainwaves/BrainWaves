# BrainWaves — Codebase Learnings

Accumulated insights from agents and developers working on this codebase.
Add entries here when you discover something non-obvious — gotchas, hidden dependencies, tricky patterns, debugging tips.

Format: brief heading + explanation + (optional) relevant file paths.

---

<!-- Add entries below this line -->

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

## Pyodide Asset Serving — Vite SPA Fallback Problem

Vite's `historyApiFallback` returns `index.html` for **all** `fetch()` requests from web workers, including `/@fs/` and `publicDir` paths. This breaks Pyodide's package loading entirely.

**Solution (two-part):**
1. A custom Vite middleware in `vite.config.ts` intercepts `/pyodide/` and `/packages/` requests before the SPA fallback and serves them directly from `src/renderer/utils/webworker/src/`.
2. An Electron `http` server on **port 17173** (started in `src/main/index.ts`) serves the same directory. Web workers use `http://127.0.0.1:17173` as `PYODIDE_ASSET_BASE`. This is the authoritative path — web worker `fetch()` calls bypass Vite entirely.

Port 17173 is hardcoded in both `src/main/index.ts` and `src/renderer/utils/webworker/webworker.js` and in the CSP (`src/renderer/index.html`).

**Other Pyodide loading gotchas:**
- `pyodide.mjs` must be loaded via dynamic `import()` (not `fetch()`), using a `?url` Vite import — `import()` bypasses the SPA fallback, `fetch()` does not
- The lock file is embedded via `?raw` and wrapped in a `Blob` + `createObjectURL` to avoid an HTTP fetch
- Use `packageBaseUrl` (not `indexURL`) to tell Pyodide where to find `.whl` files; `indexURL` is for WASM/stdlib
- `checkIntegrity: false` is required — SHA256 hashes in the npm lock file don't match CDN-downloaded wheels
- Workers must be created with `type: 'module'` (Pyodide 0.26+ ships `pyodide.mjs` as ESM)
- `optimizeDeps.exclude: ['pyodide']` in `vite.config.ts` prevents Vite from pre-bundling it

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

## Pre-existing TypeScript errors (do not treat as regressions)

- `src/renderer/epics/experimentEpics.ts` (lines 170, 205) — RxJS operator type mismatch
- `src/renderer/routes.tsx` (lines 15-17) — Redux container component prop types
