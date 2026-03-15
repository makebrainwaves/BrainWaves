# Pyodide in Electron + Vite: What We Learned

This document captures everything we learned getting Pyodide (Python-in-WASM) running reliably inside an Electron + electron-vite app. It is intended as a reference for anyone maintaining or upgrading the Pyodide integration.

---

## The Core Problem: Vite's SPA Fallback

Vite's dev server runs a `historyApiFallback` middleware that returns `index.html` for **every** `fetch()` request it doesn't recognise — including `/@fs/` paths, `publicDir` paths, and anything from a web worker. This completely breaks Pyodide's package loader, which `fetch()`es `.whl` files at runtime.

This is not an obvious failure — Pyodide may partially initialise and then hang or throw cryptic errors when it tries to load packages.

### Solution: Serve Pyodide Assets Out-of-Band

We use two complementary mechanisms:

**1. Custom Vite middleware (dev only)**

In `vite.config.ts`, a plugin intercepts requests to `/pyodide/` and `/packages/` before the SPA fallback runs and streams the files directly from `src/renderer/utils/webworker/src/`:

```ts
server.middlewares.use((req, res, next) => {
  const url = req.url ?? '';
  if (url.startsWith('/pyodide/') || url.startsWith('/packages/')) {
    const filePath = path.join(staticDir, url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.setHeader('Content-Type', contentTypes[ext] ?? 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  next();
});
```

**2. Electron local HTTP server on port 17173 (dev + prod)**

Web workers cannot use Vite's dev server at all — `fetch()` from a worker always hits the SPA fallback. The main process (`src/main/index.ts`) starts a plain Node.js `http` server at `http://127.0.0.1:17173` that serves `src/renderer/utils/webworker/src/` (dev) or `resources/webworker/src/` (prod).

The web worker (`webworker.js`) uses this as its `PYODIDE_ASSET_BASE`:

```js
const PYODIDE_ASSET_BASE = 'http://127.0.0.1:17173';
```

Port 17173 is hardcoded in three places that must stay in sync:
- `src/main/index.ts` — server listen port
- `src/renderer/utils/webworker/webworker.js` — `PYODIDE_ASSET_BASE`
- `src/renderer/index.html` — CSP `connect-src` directive

---

## Loading pyodide.mjs

Pyodide 0.26+ ships as an ES module (`pyodide.mjs`). You cannot `fetch()` it — Vite would intercept it. Instead, import it with Vite's `?url` suffix and use dynamic `import()`:

```js
import pyodideMjsUrl from 'pyodide/pyodide.mjs?url';
// ...
const { loadPyodide } = await import(/* @vite-ignore */ pyodideMjsUrl);
```

`import()` bypasses Vite's SPA fallback; `fetch()` does not.

Also required in `vite.config.ts`:

```ts
optimizeDeps: {
  exclude: ['pyodide'],  // prevent Vite from pre-bundling it
},
worker: {
  format: 'es',  // ES module workers required for pyodide.mjs
},
```

And workers must be created with `type: 'module'`:

```ts
new Worker(new URL('./webworker.js', import.meta.url), { type: 'module' });
```

---

## Loading the Lock File Without a Fetch

`loadPyodide` needs the lock file to resolve package names to filenames. Fetching it would hit Vite's SPA fallback. Instead, embed it at build time with Vite's `?raw` suffix and wrap it in a blob URL:

```js
import lockFileRaw from 'pyodide/pyodide-lock.json?raw';

const lockBlob = new Blob([lockFileRaw], { type: 'application/json' });
const lockFileURL = URL.createObjectURL(lockBlob);
const pyodide = await loadPyodide({ lockFileURL, packageBaseUrl });
URL.revokeObjectURL(lockFileURL);
```

---

## packageBaseUrl vs indexURL

These are easy to confuse:

| Option | Purpose |
|--------|---------|
| `indexURL` | Where Pyodide looks for its **runtime** files (WASM, stdlib). Already resolved from `node_modules` via `import.meta.url`. Do not override. |
| `packageBaseUrl` | Where `loadPackage()` fetches **package `.whl` files**. Set this to `http://127.0.0.1:17173/pyodide/`. |

---

## Package Integrity Checks

```js
await pyodide.loadPackage(['numpy', 'scipy', ...], { checkIntegrity: false });
```

`checkIntegrity: false` is required. The SHA-256 hashes in the npm package's `pyodide-lock.json` are computed against the CDN files, but we serve locally-downloaded copies that may differ (e.g. re-compressed). Integrity checks will fail without this flag.

---

## micropip.install() from JavaScript

`micropip` is a Python object loaded via `pyodide.pyimport()`. Passing a JavaScript array directly works fine in Pyodide 0.29.x — micropip handles the `JsProxy` conversion internally:

```js
const micropip = pyodide.pyimport('micropip');
await micropip.install(whlUrls);  // JS array works directly
```

> Note: older guidance suggested wrapping with `pyodide.toPy(whlUrls)` — this is not necessary as of 0.29.x.

---

## Offline Package Installation (InstallMNE.mjs)

`internals/scripts/InstallMNE.mjs` runs on `postinstall` and pre-downloads all packages so the app works offline.

### Part 1 — Pyodide Binary Packages (from Pyodide CDN)

These are compiled packages bundled with Pyodide. The script reads `pyodide-lock.json`, recursively resolves transitive dependencies of the root packages, and downloads each `.whl` into `src/renderer/utils/webworker/src/pyodide/`.

**Derive the CDN version from `node_modules/pyodide/package.json`**, not from `pyodide-lock.json`'s `info.version` field — that field may be a dev label like `0.28.0.dev0` and will produce a broken CDN URL.

Current root packages and why each is listed explicitly:

| Package | Reason |
|---------|--------|
| `numpy`, `scipy`, `matplotlib`, `pandas` | Core scientific stack |
| `micropip` | Needed to install pure-Python packages at worker startup |
| `pillow` | Used by matplotlib and MNE; loaded at runtime by `loadPackage()` |
| `jinja2` | MNE dep; **not** listed in matplotlib's lock-file `depends` array despite being a runtime requirement |
| `decorator` | MNE core dep; not reachable from the scientific stack in the lock file |
| `requests` | Pulled in by `pooch` at MNE import time; brings in `certifi`, `charset-normalizer`, `idna`, `urllib3` transitively |

> **Gotcha:** The `depends` arrays in `pyodide-lock.json` are incomplete. Several packages that matplotlib, scipy, or MNE require at runtime are not listed as dependencies and will not be downloaded unless added explicitly as roots.

### Part 2 — Pure-Python Packages (from PyPI)

Packages not bundled with Pyodide must be downloaded as `py3-none-any` wheels from PyPI. They are stored in `src/renderer/utils/webworker/src/packages/` and a `manifest.json` is written so the worker knows the exact filenames.

Current PyPI packages: `mne`, `pooch`, `tqdm`, `platformdirs`, `lazy-loader`

`lazy-loader` is a core MNE dependency that does not appear in the Pyodide lock at all.

---

## Plot Pipeline

### matplotlib Backend in Web Workers

Use `agg`, not `webagg`. Set it before any Python imports run:

```js
await pyodide.runPythonAsync('import os; os.environ["MPLBACKEND"] = "agg"');
```

WebAgg (`webagg`) fails in web workers because it tries to inject CSS via `js.document` during initialisation — and `js.document` does not exist in worker scope. The error looks like:

```
ImportError: cannot import name 'document' from 'js'
```

`agg` is a non-interactive raster backend that writes to a buffer, which is exactly what we need.

---

### plotKey Correlation Pattern (Fire-and-Forget Messaging)

`worker.postMessage()` returns `undefined` — there is no return channel. Redux-Observable plot load epics cannot receive the worker's result directly.

**Solution:** attach a `plotKey` string to every outgoing message; the worker echoes it back in the response object. `pyodideMessageEpic` routes by `plotKey` to the correct Redux action.

```js
// webworker.js — echo plotKey back in every response
const { data, plotKey, ...context } = event.data;
self.postMessage({ results: await pyodide.runPythonAsync(data), plotKey });
```

```ts
// pyodideMessageEpic — route by plotKey
switch (plotKey) {
  case 'ready': return of(PyodideActions.SetWorkerReady());
  case 'topo':  return of(PyodideActions.SetTopoPlot(mimeBundle));
  case 'psd':   return of(PyodideActions.SetPSDPlot(mimeBundle));
  case 'erp':   return of(PyodideActions.SetERPPlot(mimeBundle));
  default:      return of(PyodideActions.ReceiveMessage(e.data));
}
```

Plot load epics become fire-and-forget — they call `worker.postMessage()` as a side effect and emit nothing:

```ts
// loadTopoEpic
action$.pipe(
  filter(isActionOf(PyodideActions.LoadTopo)),
  tap(() => plotTestPlot(state$.value.pyodide.worker!)),
  mergeMap(() => EMPTY)
);
```

---

### Worker Readiness Gating

`loadUtils` posts `plotKey: 'ready'` when `utils.py` finishes loading. This drives an `isWorkerReady` flag in Redux state that gates any UI that depends on Python being initialised.

```ts
export const loadUtils = async (worker: Worker) =>
  worker.postMessage({ data: utilsPy, plotKey: 'ready' });
```

`pyodideMessageEpic` dispatches `PyodideActions.SetWorkerReady()` on receiving `plotKey === 'ready'`.

---

### SVG Output from matplotlib

Produce SVG in Python — no base64 encoding needed:

```python
import io
import matplotlib.pyplot as plt

_fig, _ax = plt.subplots()
_ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
_buf = io.BytesIO()
_fig.savefig(_buf, format="svg", bbox_inches="tight")
plt.close(_fig)
_buf.getvalue().decode()  # SVG string is the Python return value
```

The SVG string flows through `pyodide.runPythonAsync()` → worker `postMessage` → Redux state as `{ 'image/svg+xml': string }`.

---

### Rendering SVG Safely in the Renderer

Use a data URI on an `<img>` tag — sandboxed, no script execution:

```tsx
<img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} />
```

Prefer this over `dangerouslySetInnerHTML` — inline SVG executes `<script>` tags and has full DOM access.

---

### PNG Export from SVG

Simple canvas conversion using the SVG's natural pixel dimensions:

```ts
function svgToPngArrayBuffer(svg: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        pngBlob!.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    img.src = url;
  });
}
```

The resulting `ArrayBuffer` is passed through the IPC chain (`preload → main`) for file write. Electron's `contextBridge` serialises `ArrayBuffer` correctly without any additional conversion.

---

## Summary of File Locations

| What | Where |
|------|-------|
| Pyodide runtime + binary wheels | `src/renderer/utils/webworker/src/pyodide/` |
| Pure-Python wheels + manifest | `src/renderer/utils/webworker/src/packages/` |
| Web worker entry point | `src/renderer/utils/webworker/webworker.js` |
| JS wrappers for Python calls | `src/renderer/utils/webworker/index.ts` |
| Install script | `internals/scripts/InstallMNE.mjs` |
| Electron asset server | `src/main/index.ts` → `startPyodideAssetServer()` |
| Vite middleware | `vite.config.ts` → `serve-pyodide-assets` plugin |
| Plot widget component | `src/renderer/components/PyodidePlotWidget.tsx` |
| Plot epics (Redux-Observable) | `src/renderer/epics/pyodideEpics.ts` |
| Pyodide Redux state | `src/renderer/reducers/pyodideReducer.ts` |
