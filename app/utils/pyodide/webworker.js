/**
 * This file has been copied from pyodide source and modified to allow
 * pyodide to be used in a web worker within this
 */

self.languagePluginUrl = './src';
importScripts('./pyodide.js');

const onmessage = function(e) {
  // eslint-disable-line no-unused-vars
  languagePluginLoader.then(() => {
    // Preloaded packages
    self.pyodide.loadPackage(['matplotlib', 'mne', 'pandas']).then(() => {
      const data = e.data;
      const keys = Object.keys(data);
      for (let key of keys) {
        if (key !== 'python') {
          // Keys other than python must be arguments for the python script.
          // Set them on self, so that `from js import key` works.
          self[key] = data[key];
        }
      }

      self.pyodide
        .runPythonAsync(data.python, () => {})
        .then((results) => {
          self.postMessage({ results });
        })
        .catch((err) => {
          // if you prefer messages with the error
          self.postMessage({ error: err.message });
          // if you prefer onerror events
          // setTimeout(() => { throw err; });
        });
    });
  });
};
