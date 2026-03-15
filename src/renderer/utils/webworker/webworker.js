/**
 * Pyodide Web Worker — local node_modules implementation.
 *
 * Loading strategy
 * ----------------
 * pyodide.mjs is imported via Vite's `?url` suffix, which gives us an
 * /@fs/... URL in dev. We use dynamic import() from that URL — this works
 * because import() bypasses Vite's SPA fallback (only fetch() is affected).
 *
 * The lock file is embedded via `?raw` to avoid an HTTP fetch that Vite
 * intercepts. A blob URL is created from the embedded JSON so loadPyodide
 * can "fetch" it from memory.
 *
 * Package whl files (numpy, scipy, etc.) live in
 * src/renderer/utils/webworker/src/pyodide/ and are served by a tiny Node.js
 * HTTP server on port 17173 started in the Electron main process. This bypasses
 * Vite's dev server, which returns HTML (SPA fallback) for ALL fetch() requests
 * from web workers, including /@fs/ and publicDir paths.
 *
 * MNE and its pure-Python deps are installed via micropip from local .whl
 * files served by the same pyodide-asset:// protocol under /packages/.
 */

// ?url  → Vite resolves to /@fs/... in dev; asset URL in prod.
// ?raw  → Vite embeds file content as a string (no HTTP fetch at runtime).
import pyodideMjsUrl from 'pyodide/pyodide.mjs?url';
import lockFileRaw from 'pyodide/pyodide-lock.json?raw';

// A tiny Node.js HTTP server on port 17173 (started in the Electron main
// process) serves pyodide assets from src/renderer/utils/webworker/src/.
// This bypasses Vite's dev server, which returns index.html (SPA fallback)
// for ALL fetch() requests from web workers, including /@fs/ and publicDir paths.
const PYODIDE_ASSET_BASE = 'http://127.0.0.1:17173';

const pyodideReadyPromise = (async () => {
  const { loadPyodide } = await import(/* @vite-ignore */ pyodideMjsUrl);

  // Wrap the embedded lock file in a blob URL so loadPyodide can "fetch" it
  // without making an HTTP request that Vite would intercept and transform.
  const lockBlob = new Blob([lockFileRaw], { type: 'application/json' });
  const lockFileURL = URL.createObjectURL(lockBlob);

  // packageBaseUrl tells pyodide's PackageManager where to fetch .whl files.
  // This is the correct option — NOT indexURL, which is for the runtime files
  // (WASM, stdlib) that are already loaded via import.meta.url from node_modules.
  const packageBaseUrl = `${PYODIDE_ASSET_BASE}/pyodide/`;

  const pyodide = await loadPyodide({ lockFileURL, packageBaseUrl });
  URL.revokeObjectURL(lockFileURL);

  // Load scientific packages from local whl files via the asset server.
  // checkIntegrity: false skips SHA256 verification — hashes in the npm lock
  // file may not match the CDN-downloaded whl files we're actually serving.
  await pyodide.loadPackage(
    ['numpy', 'scipy', 'matplotlib', 'pandas', 'pillow'],
    { checkIntegrity: false }
  );

  // Set matplotlib backend before any imports so it takes effect on first import.
  // Must be 'agg' (non-interactive, buffer-based) — web workers have no DOM,
  // so WebAgg fails with "cannot import name 'document' from 'js'".
  await pyodide.runPythonAsync('import os; os.environ["MPLBACKEND"] = "agg"');

  // Load micropip so we can install MNE and its pure-Python deps.
  await pyodide.loadPackage('micropip', { checkIntegrity: false });
  const micropip = pyodide.pyimport('micropip');

  // MNE + pure-Python deps are served from /packages/ via pyodide-asset://.
  const manifestUrl = `${PYODIDE_ASSET_BASE}/packages/manifest.json`;
  const manifest = await fetch(manifestUrl).then((r) => r.json());
  const whlUrls = Object.values(manifest).map(
    ({ filename }) => `${PYODIDE_ASSET_BASE}/packages/${filename}`
  );
  await micropip.install(whlUrls);

  return pyodide;
})();

self.onmessage = async (event) => {
  // Propagate init failures back to the main thread rather than hanging silently.
  let pyodide;
  try {
    pyodide = await pyodideReadyPromise;
  } catch (error) {
    self.postMessage({ error: `Pyodide init failed: ${error.message}` });
    return;
  }

  const { data, plotKey, dataKey, fsFiles, ...context } = event.data;

  // Write any files to Pyodide's MEMFS before running Python code.
  // This allows host OS file paths to be staged in the WASM virtual filesystem.
  if (fsFiles && Array.isArray(fsFiles)) {
    for (const { path: filePath, bytes } of fsFiles) {
      pyodide.FS.writeFile(filePath, bytes);
    }
  }

  // Expose context values as globals so Python can access them via the js module.
  for (const [key, value] of Object.entries(context)) {
    self[key] = value;
  }

  try {
    let results = await pyodide.runPythonAsync(data);
    // Convert PyProxy objects (Python lists/dicts) to plain JS before postMessage,
    // which uses structuredClone — PyProxy is not serializable.
    if (results && typeof results.toJs === 'function') {
      const proxy = results;
      results = results.toJs({ dict_converter: Object.fromEntries });
      proxy.destroy();
    }
    self.postMessage({ results, plotKey, dataKey });
  } catch (error) {
    self.postMessage({ error: error.message, plotKey, dataKey });
  }
};
