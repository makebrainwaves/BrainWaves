/**
 * Post-build script for the EEG viewer assets.
 *
 * electron-vite's preload and renderer builds only support a single entry
 * point each.  This script uses esbuild directly to compile the viewer
 * preload and the viewer renderer page after the main electron-vite build.
 *
 * Run automatically via the "postbuild" npm lifecycle hook.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '../..');

// ----------------------------------------------------------------
// 1. Viewer preload:  src/preload/viewer.ts → out/viewer/viewer.js
//
// This is the <webview> preload that exposes `viewerAPI` (attached in
// src/main/index.ts via will-attach-webview). It deliberately lives in
// out/viewer/ rather than out/preload/: electron-vite empties out/preload on
// every build (including the initial build in `npm run dev`), which would delete
// it. out/viewer/ is never touched by electron-vite and is still bundled by
// electron-builder's "out/**/*" files glob for production.
// ----------------------------------------------------------------
const viewerOut = resolve(root, 'out/viewer');
mkdirSync(viewerOut, { recursive: true });

await build({
  entryPoints: [resolve(root, 'src/preload/viewer.ts')],
  bundle: true,
  platform: 'node',
  external: ['electron'],
  outfile: join(viewerOut, 'viewer.js'),
  format: 'cjs',
});

// ----------------------------------------------------------------
// 2. Viewer renderer:  src/renderer/viewer.ts → out/renderer/viewer.js
// ----------------------------------------------------------------
const rendererOut = resolve(root, 'out/renderer');
mkdirSync(rendererOut, { recursive: true });

await build({
  entryPoints: [resolve(root, 'src/renderer/viewer.ts')],
  bundle: true,
  platform: 'browser',
  outfile: join(rendererOut, 'viewer.js'),
  format: 'esm',
});

// ----------------------------------------------------------------
// 3. viewer.html:  copy src → out, update script src .ts → .js
// ----------------------------------------------------------------
let html = readFileSync(resolve(root, 'src/renderer/viewer.html'), 'utf-8');
html = html.replace('src="./viewer.ts"', 'src="./viewer.js"');
writeFileSync(join(rendererOut, 'viewer.html'), html);

console.log('Viewer builds complete: out/viewer/viewer.js, out/renderer/viewer.{js,html}');
