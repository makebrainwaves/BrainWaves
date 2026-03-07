import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);

// Load Emotiv SDK keys from keys.js and expose them as VITE_* env vars so that
// import.meta.env.VITE_* works in the renderer in both dev and production.
// Environment variables always take precedence over keys.js values.
try {
  const keys: { CLIENT_ID?: string; CLIENT_SECRET?: string; LICENSE_ID?: string } =
    _require('./keys.js');
  if (keys.CLIENT_ID) process.env.VITE_CLIENT_ID ??= keys.CLIENT_ID;
  if (keys.CLIENT_SECRET) process.env.VITE_CLIENT_SECRET ??= keys.CLIENT_SECRET;
  if (keys.LICENSE_ID) process.env.VITE_LICENSE_ID ??= keys.LICENSE_ID;
} catch {
  // keys.js may not exist in CI environments
}

export default defineConfig({
  // ------------------------------------------------------------------
  // Main process — electron-vite defaults to src/main/index.ts
  // ------------------------------------------------------------------
  main: {
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
      },
    },
  },

  // ------------------------------------------------------------------
  // Preload scripts — main window only; viewer preload is built by
  // internals/scripts/BuildViewers.js (postbuild npm hook)
  // ------------------------------------------------------------------
  preload: {},

  // ------------------------------------------------------------------
  // Renderer (React + Vite dev server)
  // ------------------------------------------------------------------
  renderer: {
    // Serve the pyodide runtime files as static assets so Vite does NOT
    // transform them.  Files in publicDir are served verbatim at the root URL:
    //   /pyodide/pyodide.mjs, /pyodide/pyodide.asm.js, /packages/*.whl, etc.
    publicDir: path.resolve(__dirname, 'src/renderer/utils/pyodide/src'),
    plugins: [
      react({
        jsxRuntime: 'classic', // React 16 does not ship react/jsx-runtime
        babel: {
          plugins: [
            // Legacy decorator support (used throughout the codebase)
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
          ],
        },
      }),
    ],
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[name]__[local]___[hash:base64:5]',
      },
    },
    resolve: {
      alias: {
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        // Browser-compatible path utilities (pathe = modern drop-in for Node's path)
        path: 'pathe',
        events: 'events',
      },
    },
    optimizeDeps: {
      include: ['@neurosity/pipes'],
      // Prevent Vite from pre-bundling pyodide. In dev mode it will be served
      // raw from node_modules via /@fs/, which is what pyodide.mjs expects.
      exclude: ['pyodide'],
    },
    worker: {
      // ES module workers are required for `import { loadPyodide } from "pyodide"`.
      format: 'es',
    },
    build: {
      rollupOptions: {
        // viewer.html + viewer.ts are handled by viewerRendererPlugin above
        input: {
          index: path.resolve(__dirname, 'src/renderer/index.html'),
        },
      },
    },
  },
});
