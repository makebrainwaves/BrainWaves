/**
 * Pyodide Web Worker
 *
 * Load order:
 *   1. Pyodide runtime (served as a static asset at /pyodide/).
 *   2. Binary packages bundled with Pyodide (numpy, scipy, matplotlib, pandas).
 *   3. MNE-Python and its pure-Python deps, installed offline from local
 *      wheel files that were pre-downloaded by `npm run install-mne-wheels`.
 *      The manifest at /packages/manifest.json maps package names → filenames.
 */

// Pyodide is served as a static asset at /pyodide/ (via Vite publicDir).
// An absolute path is required so importScripts resolves correctly regardless
// of where the worker script itself is served from.
importScripts('/pyodide/pyodide.js');

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide({ indexURL: '/pyodide/' });

  // Load binary packages that are bundled with the Pyodide npm package and
  // therefore available locally without any network request.
  await self.pyodide.loadPackage(['numpy', 'scipy', 'matplotlib', 'pandas']);

  // Load MNE and its pure-Python dependencies from pre-downloaded wheel files.
  // The manifest was written by `node internals/scripts/InstallMNE.mjs`.
  let manifest = {};
  try {
    const response = await fetch('/packages/manifest.json');
    if (response.ok) {
      manifest = await response.json();
    } else {
      console.warn('[pyodide worker] manifest.json not found — MNE will not be available');
    }
  } catch (err) {
    console.warn('[pyodide worker] Could not fetch manifest.json:', err);
  }

  const wheelUrls = Object.values(manifest)
    .map((entry) => `/packages/${entry.filename}`);

  if (wheelUrls.length > 0) {
    await self.pyodide.loadPackage('micropip');
    const micropip = self.pyodide.pyimport('micropip');
    // micropip resolves relative URLs against the worker's base URL.
    // Pass absolute URLs so it works regardless of worker location.
    const absoluteUrls = wheelUrls.map(
      (u) => new URL(u, self.location.origin).href
    );
    await micropip.install(absoluteUrls);
  } else {
    console.warn('[pyodide worker] No MNE wheels found in manifest.');
  }
}

let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  await pyodideReadyPromise;

  const { data, ...context } = event.data;
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }

  try {
    self.postMessage({
      results: await self.pyodide.runPythonAsync(data),
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
