/**
 * This file has been copied from pyodide source and modified to allow
 * pyodide to be used in a web worker within this
 */

// pyodide is served as a static asset at /pyodide/ (via Vite publicDir).
// An absolute path is required so importScripts resolves correctly regardless
// of where the worker script itself is served from.
importScripts('/pyodide/pyodide.js');

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide({ indexURL: '/pyodide/' });
  await self.pyodide.loadPackage(['matplotlib', 'mne', 'pandas']);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  // make sure loading is done
  await pyodideReadyPromise;
  // Don't bother yet with this line, suppose our API is built in such a way:
  const { data, ...context } = event.data;
  // The worker copies the context in its own "memory" (an object mapping name to values)
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }
  // Now is the easy part, the one that is similar to working in the main thread:
  try {
    self.postMessage({
      results: await self.pyodide.runPythonAsync(data),
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
