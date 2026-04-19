/**
 * Post-install patches for dependencies that have browser-incompatible code.
 *
 * NOTE: plotly.js was upgraded from v1 (bundled d3 v3) to v2 (d3 v6, pure ESM),
 * so the previous `this.document` / `this.navigator` patches are no longer needed.
 *
 * This file is kept as a placeholder for any future dependency patches and is
 * still wired into `postinstall` and `dev` npm scripts.
 */

import {
  existsSync,
  lstatSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { execSync } from 'child_process';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { arch, platform } from 'os';

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
  const correct = 'Electron.app/Contents/MacOS/Electron';
  const binary = join(root, 'node_modules/electron', correct);

  if (current !== correct && existsSync(binary)) {
    writeFileSync(pathTxt, correct);
    console.log('[patchDeps] Fixed electron path.txt:', correct);
  }
}

/**
 * node-labstreaminglayer 0.3.0 ships only an x86_64 liblsl.dylib in its
 * prebuild/ directory. On Apple Silicon it fails to load with an "incompatible
 * architecture" error. Replace it with a symlink to the Homebrew-installed
 * arm64 build (`brew install labstreaminglayer/tap/lsl`).
 */
function fixLiblslArm64() {
  if (platform() !== 'darwin' || arch() !== 'arm64') return;

  const bundled = join(
    root,
    'node_modules/node-labstreaminglayer/prebuild/liblsl.dylib'
  );
  if (!existsSync(bundled)) return;

  let brewLib;
  try {
    const cellar = execSync('brew --cellar lsl', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const versionDir = execSync(`ls "${cellar}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .sort()
      .pop();
    if (!versionDir) return;
    brewLib = join(
      cellar,
      versionDir,
      'Frameworks/lsl.framework/Versions/A/lsl'
    );
  } catch {
    console.warn(
      '[patchDeps] Apple Silicon detected but liblsl is not installed.\n' +
        '           Run: brew install labstreaminglayer/tap/lsl'
    );
    return;
  }

  if (!existsSync(brewLib)) return;

  const stat = lstatSync(bundled);
  if (stat.isSymbolicLink() && readlinkSync(bundled) === brewLib) return;

  unlinkSync(bundled);
  symlinkSync(brewLib, bundled);
  console.log('[patchDeps] Symlinked arm64 liblsl.dylib →', brewLib);
}

fixElectronPathTxt();
fixLiblslArm64();
console.log('[patchDeps] Done.');
