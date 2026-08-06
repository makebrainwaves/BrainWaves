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
 * src/renderer/utils/webworker/src/pyodide/ and are served via a custom
 * Electron protocol scheme (pyodide://) registered in the main process.
 * This requires no network socket and works in both dev and production.
 *
 * MNE and its pure-Python deps: JS fetches each .whl via pyodide://, writes
 * the bytes into Pyodide's emscripten FS (/tmp/), then micropip installs from
 * emfs:///tmp/ — micropip only accepts http/https/emfs URLs, not custom schemes.
 */

// ?url  → Vite resolves to /@fs/... in dev; asset URL in prod.
// ?raw  → Vite embeds file content as a string (no HTTP fetch at runtime).
import pyodideMjsUrl from 'pyodide/pyodide.mjs?url';
import lockFileRaw from 'pyodide/pyodide-lock.json?raw';

// Custom Electron protocol scheme registered in src/main/index.ts.
// Serves files from src/renderer/utils/webworker/src/ (dev) or
// resources/webworker/src/ (prod) without opening a network socket.
const PYODIDE_ASSET_BASE = 'pyodide://host';

const pyodideReadyPromise = (async () => {
  const { loadPyodide } = await import(/* @vite-ignore */ pyodideMjsUrl);

  // Wrap the embedded lock file in a blob URL so loadPyodide can "fetch" it
  // without making an HTTP request that Vite would intercept and transform.
  const lockBlob = new Blob([lockFileRaw], { type: 'application/json' });
  const lockFileURL = URL.createObjectURL(lockBlob);

  // packageBaseUrl tells pyodide's PackageManager where to fetch .whl files.
  // indexURL is where pyodide loads its runtime files (pyodide.asm.wasm,
  // python_stdlib.zip). In dev, pyodide.mjs is imported from /@fs/.../node_modules
  // and its sibling assets are served by Vite middleware. In prod the bundled
  // .mjs lives in out/renderer/assets/ without its siblings, so import.meta.url
  // resolution fails — we route both through our pyodide:// protocol handler.
  const packageBaseUrl = `${PYODIDE_ASSET_BASE}/pyodide/`;
  const indexURL = `${PYODIDE_ASSET_BASE}/pyodide/`;

  const pyodide = await loadPyodide({ lockFileURL, packageBaseUrl, indexURL });
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

  // MNE + pure-Python deps: micropip only accepts http://, https://, emfs://,
  // and relative paths — it rejects the pyodide:// custom scheme.
  // Workaround: JS-fetch each .whl via the protocol handler (which supports it),
  // write the bytes into Pyodide's emscripten virtual FS, then install via emfs://.
  const manifest = await fetch(
    `${PYODIDE_ASSET_BASE}/packages/manifest.json`
  ).then((r) => r.json());

  for (const { filename } of Object.values(manifest)) {
    const buffer = await fetch(
      `${PYODIDE_ASSET_BASE}/packages/${filename}`
    ).then((r) => r.arrayBuffer());
    pyodide.FS.writeFile(`/tmp/${filename}`, new Uint8Array(buffer));
  }

  await micropip.install(
    Object.values(manifest).map(({ filename }) => `emfs:///tmp/${filename}`)
  );

  return pyodide;
})();

// Async onmessage handlers can overlap; chain work so Python globals like
// clean_epochs exist before follow-up commands (GetEpochsInfo, LoadTopo, etc.).
let workChain = Promise.resolve();

async function processMessage(event) {
  // Propagate init failures back to the main thread rather than hanging silently.
  let pyodide;
  try {
    pyodide = await pyodideReadyPromise;
  } catch (error) {
    self.postMessage({ error: `Pyodide init failed: ${error.message}` });
    return;
  }

  const { data, plotKey, dataKey, fsFiles, readFileAfter, ...context } =
    event.data;

  // Write any files to Pyodide's MEMFS before running Python code, so host OS
  // paths (e.g. .fif epoch files) can be staged in the WASM virtual filesystem.
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
    // which uses structuredClone — a PyProxy is not serializable and would throw.
    if (results && typeof results.toJs === 'function') {
      const proxy = results;
      results = results.toJs({ dict_converter: Object.fromEntries });
      proxy.destroy();
    }
    // Read-back path: after running Python (e.g. epochs.save() to a MEMFS path),
    // return the file's bytes to the renderer as a transferable ArrayBuffer so it
    // can be written to host disk. Pyodide's MEMFS can't reach the host FS itself.
    if (readFileAfter) {
      const fileBytes = pyodide.FS.readFile(readFileAfter); // Uint8Array
      const payload = { buffer: fileBytes.buffer, plotKey, dataKey };
      // epochArrays needs metadata alongside the buffer; savedEpochs only needs bytes.
      if (dataKey === 'epochArrays') {
        payload.results = results;
      }
      self.postMessage(payload, [fileBytes.buffer]);
      return;
    }
    // Fire-and-forget commands (no plotKey/dataKey/readFileAfter) must not post
    // MNE objects back — they aren't structured-cloneable even after toJs.
    if (plotKey || dataKey) {
      self.postMessage({ results, plotKey, dataKey });
    }
  } catch (error) {
    self.postMessage({ error: error.message, plotKey, dataKey });
  }
}

self.onmessage = (event) => {
  workChain = workChain.then(() => processMessage(event));
};
