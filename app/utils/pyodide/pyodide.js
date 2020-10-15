/**
 * The main bootstrap script for loading pyodide.
 */
const port = process.env.PORT || 1212;

export const languagePluginLoader = new Promise((resolve, reject) => {
  let baseURL = `http://localhost:${port}/src/`;
  // var baseURL = self.languagePluginUrl || 'https://iodide.io/pyodide-demo/';
  baseURL = `${baseURL.substr(0, baseURL.lastIndexOf('/'))}/`;

  /// /////////////////////////////////////////////////////////
  // Package loading
  const loadedPackages = [];
  let loadPackagePromise = new Promise((resolve) => resolve());
  // Regexp for validating package name and URI
  var package_name_regexp = '[a-z0-9_][a-z0-9_-]*';
  const package_uri_regexp = new RegExp(
    `^https?://.*?(${package_name_regexp}).js$`,
    'i'
  );
  var package_name_regexp = new RegExp(`^${package_name_regexp}$`, 'i');

  const _uri_to_package_name = (package_uri) => {
    // Generate a unique package name from URI

    if (package_name_regexp.test(package_uri)) {
      return package_uri;
    }
    if (package_uri_regexp.test(package_uri)) {
      const match = package_uri_regexp.exec(package_uri);
      // Get the regexp group corresponding to the package name
      return match[1];
    }
    return null;
  };

  // clang-format off
  const preloadWasm = () => {
    // On Chrome, we have to instantiate wasm asynchronously. Since that
    // can't be done synchronously within the call to dlopen, we instantiate
    // every .so that comes our way up front, caching it in the
    // `preloadedWasm` dictionary.

    let promise = new Promise((resolve) => resolve());
    const { FS } = pyodide._module;

    function recurseDir(rootpath) {
      let dirs;
      try {
        dirs = FS.readdir(rootpath);
      } catch (err) {
        return;
      }
      for (const entry of dirs) {
        if (entry.startsWith('.')) {
          continue;
        }
        const path = rootpath + entry;
        if (entry.endsWith('.so')) {
          if (Module.preloadedWasm[path] === undefined) {
            promise = promise
              .then(() =>
                Module.loadWebAssemblyModule(FS.readFile(path), {
                  loadAsync: true,
                })
              )
              .then((module) => {
                Module.preloadedWasm[path] = module;
              });
          }
        } else if (FS.isDir(FS.lookupPath(path).node.mode)) {
          recurseDir(`${path}/`);
        }
      }
    }

    recurseDir('/');

    return promise;
  };
  // clang-format on

  function loadScript(url, onload, onerror) {
    if (self.document) {
      // browser
      const script = self.document.createElement('script');
      script.src = url;
      script.onload = (e) => {
        onload();
      };
      script.onerror = (e) => {
        onerror();
      };
      self.document.head.appendChild(script);
    } else if (self.importScripts) {
      // webworker
      try {
        self.importScripts(url);
        onload();
      } catch (err) {
        onerror();
      }
    }
  }

  const _loadPackage = (names, messageCallback) => {
    // DFS to find all dependencies of the requested packages
    const packages = self.pyodide._module.packages.dependencies;
    const { loadedPackages } = self.pyodide;
    const queue = [].concat(names || []);
    const toLoad = [];
    while (queue.length) {
      let package_uri = queue.pop();

      const packageName = _uri_to_package_name(package_uri);

      if (packageName == null) {
        console.error(`Invalid package name or URI '${package_uri}'`);
        return;
      }
      if (packageName == package_uri) {
        package_uri = 'default channel';
      }

      if (packageName in loadedPackages) {
        if (package_uri != loadedPackages[packageName]) {
          console.error(
            `URI mismatch, attempting to load package ` +
              `${packageName} from ${package_uri} while it is already ` +
              `loaded from ${loadedPackages[packageName]}!`
          );
          return;
        }
      } else if (packageName in toLoad) {
        if (package_uri != toLoad[packageName]) {
          console.error(
            `URI mismatch, attempting to load package ` +
              `${packageName} from ${package_uri} while it is already ` +
              `being loaded from ${toLoad[packageName]}!`
          );
          return;
        }
      } else {
        console.log(`Loading ${packageName} from ${package_uri}`);

        toLoad[packageName] = package_uri;
        if (packages.hasOwnProperty(packageName)) {
          packages[packageName].forEach((subpackage) => {
            if (!(subpackage in loadedPackages) && !(subpackage in toLoad)) {
              queue.push(subpackage);
            }
          });
        } else {
          console.error(`Unknown package '${packageName}'`);
        }
      }
    }

    self.pyodide._module.locateFile = (path) => {
      // handle packages loaded from custom URLs
      const packageName = path.replace(/\.data$/, '');
      if (packageName in toLoad) {
        const package_uri = toLoad[packageName];
        if (package_uri != 'default channel') {
          return package_uri.replace(/\.js$/, '.data');
        }
      }
      return baseURL + path;
    };

    const promise = new Promise((resolve, reject) => {
      if (Object.keys(toLoad).length === 0) {
        resolve('No new packages to load');
        return;
      }

      const packageList = Array.from(Object.keys(toLoad)).join(', ');
      if (messageCallback !== undefined) {
        messageCallback(`Loading ${packageList}`);
      }

      // monitorRunDependencies is called at the beginning and the end of each
      // package being loaded. We know we are done when it has been called
      // exactly "toLoad * 2" times.
      let packageCounter = Object.keys(toLoad).length * 2;

      self.pyodide._module.monitorRunDependencies = () => {
        packageCounter--;
        if (packageCounter === 0) {
          for (const packageName in toLoad) {
            self.pyodide.loadedPackages[packageName] = toLoad[packageName];
          }
          delete self.pyodide._module.monitorRunDependencies;
          self.removeEventListener('error', windowErrorHandler);
          if (!isFirefox) {
            preloadWasm().then(() => {
              resolve(`Loaded ${packageList}`);
            });
          } else {
            resolve(`Loaded ${packageList}`);
          }
        }
      };

      // Add a handler for any exceptions that are thrown in the process of
      // loading a package
      var windowErrorHandler = (err) => {
        delete self.pyodide._module.monitorRunDependencies;
        self.removeEventListener('error', windowErrorHandler);
        // Set up a new Promise chain, since this one failed
        loadPackagePromise = new Promise((resolve) => resolve());
        reject(err.message);
      };
      self.addEventListener('error', windowErrorHandler);

      for (const packageName in toLoad) {
        let scriptSrc;
        const package_uri = toLoad[packageName];
        if (package_uri == 'default channel') {
          scriptSrc = `${baseURL}${packageName}.js`;
        } else {
          scriptSrc = `${package_uri}`;
        }
        loadScript(
          scriptSrc,
          () => {},
          () => {
            // If the package_uri fails to load, call monitorRunDependencies twice
            // (so packageCounter will still hit 0 and finish loading), and remove
            // the package from toLoad so we don't mark it as loaded.
            console.error(`Couldn't load package from URL ${scriptSrc}`);
            const index = toLoad.indexOf(packageName);
            if (index !== -1) {
              toLoad.splice(index, 1);
            }
            for (let i = 0; i < 2; i++) {
              self.pyodide._module.monitorRunDependencies();
            }
          }
        );
      }

      // We have to invalidate Python's import caches, or it won't
      // see the new files. This is done here so it happens in parallel
      // with the fetching over the network.
      self.pyodide.runPython(
        'import importlib as _importlib\n' + '_importlib.invalidate_caches()\n'
      );
    });

    return promise;
  };

  const loadPackage = (names, messageCallback) => {
    /* We want to make sure that only one loadPackage invocation runs at any
     * given time, so this creates a "chain" of promises. */
    loadPackagePromise = loadPackagePromise.then(() =>
      _loadPackage(names, messageCallback)
    );
    return loadPackagePromise;
  };

  /// /////////////////////////////////////////////////////////
  // Fix Python recursion limit
  function fixRecursionLimit(pyodide) {
    // The Javascript/Wasm call stack may be too small to handle the default
    // Python call stack limit of 1000 frames. This is generally the case on
    // Chrom(ium), but not on Firefox. Here, we determine the Javascript call
    // stack depth available, and then divide by 50 (determined heuristically)
    // to set the maximum Python call stack depth.

    let depth = 0;
    function recurse() {
      depth += 1;
      recurse();
    }
    try {
      recurse();
    } catch (err) {}

    let recursionLimit = depth / 50;
    if (recursionLimit > 1000) {
      recursionLimit = 1000;
    }
    pyodide.runPython(
      `import sys; sys.setrecursionlimit(int(${recursionLimit}))`
    );
  }

  /// /////////////////////////////////////////////////////////
  // Rearrange namespace for public API
  const PUBLIC_API = [
    'globals',
    'loadPackage',
    'loadedPackages',
    'pyimport',
    'repr',
    'runPython',
    'runPythonAsync',
    'checkABI',
    'version',
  ];

  function makePublicAPI(module, public_api) {
    const namespace = { _module: module };
    for (const name of public_api) {
      namespace[name] = module[name];
    }
    return namespace;
  }

  /// /////////////////////////////////////////////////////////
  // Loading Pyodide
  const wasmURL = `${baseURL}pyodide.asm.wasm`;
  let Module = {};
  self.Module = Module;

  Module.noImageDecoding = true;
  Module.noAudioDecoding = true;
  Module.noWasmDecoding = true;
  Module.preloadedWasm = {};
  let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  const wasm_promise = WebAssembly.compileStreaming(fetch(wasmURL));
  Module.instantiateWasm = (info, receiveInstance) => {
    wasm_promise
      .then((module) => WebAssembly.instantiate(module, info))
      .then((instance) => receiveInstance(instance));
    return {};
  };

  Module.checkABI = function (ABI_number) {
    if (ABI_number !== parseInt('1')) {
      const ABI_mismatch_exception = `ABI numbers differ. Expected 1, got ${ABI_number}`;
      console.error(ABI_mismatch_exception);
      throw ABI_mismatch_exception;
    }
    return true;
  };

  Module.locateFile = (path) => baseURL + path;
  const postRunPromise = new Promise((resolve, reject) => {
    Module.postRun = () => {
      delete self.Module;
      fetch(`${baseURL}packages.json`)
        .then((response) => response.json())
        .then((json) => {
          fixRecursionLimit(self.pyodide);
          self.pyodide.globals = self.pyodide.runPython(
            'import sys\nsys.modules["__main__"]'
          );
          self.pyodide = makePublicAPI(self.pyodide, PUBLIC_API);
          self.pyodide._module.packages = json;
          resolve();
        });
    };
  });

  const dataLoadPromise = new Promise((resolve, reject) => {
    Module.monitorRunDependencies = (n) => {
      if (n === 0) {
        delete Module.monitorRunDependencies;
        resolve();
      }
    };
  });

  Promise.all([postRunPromise, dataLoadPromise]).then(() => resolve());

  const data_script_src = `${baseURL}pyodide.asm.data.js`;
  loadScript(
    data_script_src,
    () => {
      const scriptSrc = `${baseURL}pyodide.asm.js`;
      loadScript(
        scriptSrc,
        () => {
          // The emscripten module needs to be at this location for the core
          // filesystem to install itself. Once that's complete, it will be replaced
          // by the call to `makePublicAPI` with a more limited public API.
          self.pyodide = pyodide(Module);
          self.pyodide.loadedPackages = [];
          self.pyodide.loadPackage = loadPackage;
        },
        () => {}
      );
    },
    () => {}
  );
});
