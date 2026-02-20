# BrainWaves Migration Session Summary

## Architecture Change: Webpack/Babel/Yarn → Electron-Vite/npm

The project was migrated from a legacy Electron + Webpack + Babel + Yarn stack to a modern **electron-vite** setup. This is a significant architectural shift:

| Concern | Before | After |
|---|---|---|
| Build system | Webpack + Babel | **electron-vite** (esbuild + Rollup) |
| Package manager | Yarn | **npm** |
| Module format | CommonJS (`require`) | **ESM** (`import`) |
| Env variables (renderer) | `process.env.*` | **`import.meta.env.VITE_*`** |
| Process split | Single config | **Three explicit targets**: `main`, `preload`, `renderer` |
| Path utilities | `path-browserify` (2019, no ESM) | **`pathe`** (modern, pure ESM) |
| Dev server | Webpack HMR | **Vite HMR** |

The electron-vite architecture enforces a clean Electron process split:
- **Main** (`src/main/index.ts`) — Node.js process, IPC handlers, file system
- **Preload** (`src/preload/index.ts`) — sandboxed bridge with `contextBridge`
- **Renderer** (`src/renderer/`) — pure browser context, React app

---

## Major Work Done

### 1. Build System Migration
- Replaced all Webpack config with `vite.config.ts` using `defineConfig` from `electron-vite`
- Converted `require()` calls to ESM `import` statements across the codebase
- Used `git mv` for all file renames to preserve git history
- Set `package.json` `"main"` field to `"./out/main/index.js"` (electron-vite's output convention)

### 2. Electron API Modernization
- **Replaced deprecated devtools APIs**: `session.getAllExtensions()` / `session.loadExtension()` → `session.extensions.*` (new namespaced API)
- **Fixed preload `process` conflict**: Removed redundant `import process from 'process'` — Electron injects it natively
- **Added dev HTTP cache clearing**: `session.defaultSession.clearCache()` in `app.whenReady()` (dev only) to prevent Electron's persistent HTTP cache from serving stale Vite pre-bundled assets

### 3. Dependency Upgrades

| Package | From | To | Reason |
|---|---|---|---|
| `@neurosity/pipes` | v3 | **v5** | Eliminated `dsp.js` which used `this[name]` globals incompatible with strict ESM |
| `rxjs` | v6 | **v7** | Required by pipes v5 |
| `redux-observable` | v1 | **v2-rc** | Required by RxJS v7 |
| `plotly.js` | v1.54 (bundles **d3 v3**) | **v2.35** (uses d3 v6) | Eliminated all `this.document` / `this.navigator` / `this.Element` errors |
| `react-plotly.js` | v2.4 | **v2.6** | Compatibility with plotly.js v2 |
| `d3` (direct) | v5.16 | **v7.9** | Modern pure-ESM version |
| `path-browserify` | v1 (2019, CJS) | **`pathe`** (modern ESM) | Drop-in replacement with active maintenance |

### 4. Environment Variable Migration
Renderer code cannot access `process.env` in Vite (no Node.js context). All renderer references were migrated:
- `process.env.CLIENT_ID` → `import.meta.env.VITE_CLIENT_ID`
- `process.env.NODE_ENV` → `import.meta.env.MODE`
- Emotiv SDK credentials are loaded from `keys.js` at config time and injected as `process.env.VITE_*` so Vite picks them up natively

### 5. Content Security Policy (CSP)
Built up the CSP in `src/renderer/index.html` incrementally to allow legitimate sources while remaining secure:
- Added `https://fonts.googleapis.com` to `style-src` (Semantic UI's Google Fonts)
- Added `https://fonts.gstatic.com` to `font-src` (actual font files)
- Added `webpack:` to `connect-src` (source map protocol)
- Added `'self'` to `worker-src` (Vite serves workers as HTTP URLs in dev, not `blob:`)

### 6. Pyodide / Web Worker Fix
- **Problem**: Vite transforms every `.js` file it serves by injecting `import { createHotContext } from '/@vite/client'`, turning files into ES modules. `importScripts()` in a classic worker cannot execute ES modules — causing a `NetworkError`.
- **Fix**: Configured `publicDir` in the renderer Vite config to point at the pyodide install directory (`src/renderer/utils/pyodide/src/`). Vite serves `publicDir` files verbatim with zero transformation. Updated `webworker.js` to use absolute paths (`/pyodide/pyodide.js`) instead of fragile relative ones.

### 7. redux-observable v2 API Fix
`action$.ofType()` was removed in redux-observable v2. Updated three call sites in `experimentEpics.ts` to use the pipeable `ofType` operator:

```ts
// Before (v1):
action$.ofType('@@router/LOCATION_CHANGE').pipe(...)

// After (v2):
action$.pipe(ofType('@@router/LOCATION_CHANGE'), ...)
```

### 8. Browser Compatibility Fixes
- **`cortex.js`**: `global.process` → `typeof process !== 'undefined' && process.env` (no `global` in browser)
- **`muse.ts`**: Removed `import 'hazardous'` — a Node.js-only asar path library that was incorrectly imported in the renderer

---

## Key Roadblocks

### Electron HTTP Cache vs. Vite Pre-bundle Cache
The trickiest issue of the session. Vite sets `Cache-Control: max-age=31536000, immutable` on
pre-bundled deps. Electron's renderer stores these permanently in
`~/Library/Application Support/BrainWaves/Cache/`. Even after patching files on disk, Electron
kept serving the old cached version because the URL's `v=` hash hadn't changed (Vite keys its
cache hash on the package version, not file content). The solution required both patching the
Vite pre-bundle cache file on disk *and* clearing the Electron session HTTP cache at startup
in dev mode (`session.defaultSession.clearCache()`).

### plotly.js / d3 v3 `this.xxx` Chain
Three separate globals (`this.document`, `this.Element`, `this.CSSStyleDeclaration`,
`this.navigator`) needed patching before the root cause was identified as d3 v3 being bundled
inside plotly.js v1. In Vite's strict-mode ESM context, bare `this` at the module level is
`undefined`. Upgrading to plotly.js v2 (which uses d3 v6, pure ESM) eliminated all of them at
once.

### `patchDeps.mjs` Strategy Evolution
The plotly fix went through several iterations before the root cause was found:
1. Vite server middleware to intercept HTTP requests — failed due to middleware ordering
2. esbuild plugin in `optimizeDeps.esbuildOptions` — didn't apply to already-cached bundles
3. Patching the npm source only — Vite doesn't re-bundle when the package version hasn't changed
4. Patching both source and Vite's cached pre-bundle file — worked, but made entirely moot by upgrading plotly.js to v2

### Pyodide Worker Loading
The worker's `importScripts()` call appeared to reference a valid URL, but the load silently
failed. The cause was subtle: Vite injects HMR boilerplate (an `import` statement) into every
`.js` file it serves, converting them to ES modules. `importScripts()` in a classic worker
can only execute classic scripts — not ES modules. Moving pyodide to `publicDir` bypassed
Vite's transform pipeline entirely.
