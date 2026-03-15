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

## Pre-existing TypeScript errors (do not treat as regressions)

- `src/renderer/epics/experimentEpics.ts` (lines 170, 205) — RxJS operator type mismatch
- `src/renderer/routes.tsx` (lines 15-17) — Redux container component prop types
