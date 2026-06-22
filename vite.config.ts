import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // ------------------------------------------------------------------
  // Main process — electron-vite defaults to src/main/index.ts
  // ------------------------------------------------------------------
  main: {
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@shared': path.resolve(__dirname, 'src/shared'),
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
    publicDir: path.resolve(__dirname, 'src/renderer/utils/webworker/src'),
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
    resolve: {
      alias: {
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        // Browser-compatible path utilities (pathe = modern drop-in for Node's path)
        path: 'pathe',
        events: 'events',
      },
    },
    server: {
      fs: {
        // Allow /@fs/ access to the whole repo root so lab.js can load
        // experiment stimuli from their absolute filesystem paths.
        allow: ['.'],
      },
    },
    optimizeDeps: {
      include: ['@neurosity/pipes'],
      // Prevent Vite from pre-bundling pyodide. In dev mode it will be served
      // raw from node_modules via /@fs/, which is what pyodide.mjs expects.
      exclude: ['pyodide'],
    },
    worker: {
      // ES module workers are required for the CDN import in webworker.js.
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
