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

## liblsl on Apple Silicon

`node-labstreaminglayer@0.3.0` ships only an **x86_64** `liblsl.dylib` in its `prebuild/` directory — the package has no arm64 build and was last updated 2025-08. Loading it on Apple Silicon throws `Failed to load shared library: ... (mach-o file, but is an incompatible architecture)`.

**Fix**: install liblsl via Homebrew (`brew install labstreaminglayer/tap/lsl`), then `internals/scripts/patchDeps.mjs` symlinks `/opt/homebrew/Cellar/lsl/<version>/Frameworks/lsl.framework/Versions/A/lsl` over the bundled x86_64 dylib on every install/dev run. The patch is a no-op on x86_64 macs and on Linux/Windows (which ship usable `.so`/`.dll` in the same prebuild dir).

Alternatives evaluated and rejected: `@neurodevs/node-lsl` and `@neurodevs/ndx-native` both require the same Homebrew install (they hard-code `/opt/homebrew/Cellar/lsl/...` paths) and have a much different async/worker-thread API that would force a substantial rewrite.

## Pre-existing TypeScript errors (do not treat as regressions)

- `src/renderer/epics/experimentEpics.ts` (lines 170, 205) — RxJS operator type mismatch
- `src/renderer/routes.tsx` (lines 15-17) — Redux container component prop types
