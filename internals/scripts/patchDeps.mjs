/**
 * Post-install patches for dependencies that have browser-incompatible code.
 *
 * NOTE: plotly.js was upgraded from v1 (bundled d3 v3) to v2 (d3 v6, pure ESM),
 * so the previous `this.document` / `this.navigator` patches are no longer needed.
 *
 * This file is kept as a placeholder for any future dependency patches and is
 * still wired into `postinstall` and `dev` npm scripts.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

/**
 * electron-builder install-app-deps (v26+) rewrites node_modules/electron/path.txt
 * to a path without the `dist/` prefix. Fix it so electron-vite can find the binary.
 */
function fixElectronPathTxt() {
  const pathTxt = join(root, 'node_modules/electron/path.txt');
  if (!existsSync(pathTxt)) return;

  const current = readFileSync(pathTxt, 'utf8').trim();
  const correct = 'dist/Electron.app/Contents/MacOS/Electron';
  const binary = join(root, 'node_modules/electron', correct);

  if (current !== correct && existsSync(binary)) {
    writeFileSync(pathTxt, correct);
    console.log('[patchDeps] Fixed electron path.txt:', correct);
  }
}

fixElectronPathTxt();
console.log('[patchDeps] Done.');
