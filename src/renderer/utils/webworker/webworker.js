/**
 * Pyodide Web Worker — local node_modules implementation.
 *
 * Loading strategy
 * ----------------
 * Use Vite's `?url` suffix on 'pyodide/pyodide.mjs' to get the resolved file URL
 * at build/dev time (/@fs/... in dev, an asset URL in prod), then dynamically
 * import from that URL. This bypasses Vite's SPA fallback and lets pyodide.mjs
 * resolve all sibling assets (pyodide.asm.wasm, pyodide-lock.json, etc.) via
 * import.meta.url — no CDN required.
 *
 * Production builds use the files copied to publicDir by InstallPyodide.mjs.
 */

// ?url tells Vite to resolve the path and return a URL string rather than bundling
// the module. In dev mode this is a /@fs/ URL (bypasses SPA fallback); in prod it
// is an asset URL. We then dynamically import from that URL so pyodide.mjs can
// resolve all its sibling assets (pyodide.asm.wasm, etc.) via import.meta.url.
import pyodideMjsUrl from 'pyodide/pyodide.mjs?url';

const pyodideReadyPromise = (async () => {
  const { loadPyodide } = await import(/* @vite-ignore */ pyodideMjsUrl);
  return loadPyodide();
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
