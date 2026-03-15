/**
 * Pyodide Web Worker — ES module worker following the pattern from
 * https://gitlab.com/castedo/pyodide-worker-example
 *
 * Loading strategy
 * ----------------
 * 1. `import { loadPyodide } from "pyodide"` — Vite resolves this to
 *    node_modules/pyodide/pyodide.mjs and serves it from /@fs/… in dev mode,
 *    completely bypassing any publicDir transform issues.
 *
 * 2. `indexURL: '/pyodide/'` — tells pyodide where to find pyodide-lock.json
 *    and binary package wheels (.whl).  These are served from publicDir:
 *      src/renderer/utils/pyodide/src/pyodide/
 *    which is populated by:
 *      • InstallPyodide.mjs  (copies pyodide-lock.json + runtime from npm)
 *      • InstallMNE.mjs      (downloads binary wheels from Pyodide CDN)
 *
 * 3. Binary packages (numpy / scipy / matplotlib / pandas) — loaded via
 *    pyodide.loadPackage(), resolved from local /pyodide/ files.
 *
 * 4. MNE + pure-Python deps — installed via micropip from pre-downloaded
 *    wheels in /packages/, listed in /packages/manifest.json.
 *    Populated by InstallMNE.mjs Part 2 (PyPI).
 */

import { loadPyodide } from 'pyodide';

async function initPyodide() {
  // indexURL tells pyodide where to load pyodide-lock.json and binary wheels.
  // The publicDir (src/renderer/utils/pyodide/src/) is served at the web root,
  // so /pyodide/ maps to src/renderer/utils/pyodide/src/pyodide/.
  const pyodide = await loadPyodide({ indexURL: '/pyodide/' });

  // Load binary packages from locally served .whl files.
  await pyodide.loadPackage(['numpy', 'scipy', 'matplotlib', 'pandas']);

  // Install MNE and its pure-Python deps from pre-downloaded wheels.
  let manifest = {};
  try {
    const res = await fetch(new URL('/packages/manifest.json', self.location.href).href);
    if (res.ok) {
      manifest = await res.json();
    } else {
      console.warn('[pyodide worker] manifest.json not found — MNE unavailable');
    }
  } catch (err) {
    console.warn('[pyodide worker] Could not fetch manifest.json:', err);
  }

  const wheelUrls = Object.values(manifest).map(
    (entry) => new URL(`/packages/${entry.filename}`, self.location.href).href
  );

  if (wheelUrls.length > 0) {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');
    await micropip.install(wheelUrls);
  } else {
    console.warn('[pyodide worker] No MNE wheels in manifest — skipping micropip install');
  }

  return pyodide;
}

// Start loading immediately so it is ready when the first message arrives.
const pyodideReadyPromise = initPyodide();

self.onmessage = async (event) => {
  const pyodide = await pyodideReadyPromise;

  const { data, ...context } = event.data;

  // Expose context values as globals so Python can access them via the js module.
  for (const [key, value] of Object.entries(context)) {
    self[key] = value;
  }

  try {
    self.postMessage({ results: await pyodide.runPythonAsync(data) });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
