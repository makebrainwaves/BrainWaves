import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  PYODIDE_SOURCE_DIR,
  PYODIDE_RESOURCE_DIR,
} from '../src/shared/pyodideAssets';

/**
 * Post-build checks: the bundles and the Pyodide payload are actually on disk
 * where the packaged app will look for them. Requires `npm run build` and a
 * full `npm install` — run via `npm run test:build`.
 *
 * Named .check.ts, not .test.ts, so the default vitest glob skips it: running
 * these without a build should be a loud ordering error, not a silent skip.
 */

// process.cwd(), not __dirname — test files are ESM, where __dirname is undefined.
const repoRoot = process.cwd();
const out = (...p: string[]) => path.join(repoRoot, 'out', ...p);
const webworkerSrc = path.join(repoRoot, PYODIDE_SOURCE_DIR);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
);

describe('electron-vite build output', () => {
  it.each([
    ['main', out('main/index.js')],
    ['preload', out('preload/index.js')],
    ['renderer', out('renderer/index.html')],
  ])('emits the %s bundle', (_label, filePath) => {
    expect(
      fs.existsSync(filePath),
      `${filePath} missing — run \`npm run build\` first`
    ).toBe(true);
  });
});

describe('Pyodide payload', () => {
  // package.json is JSON and cannot import the shared constants, so this is the
  // one place that pairing gets checked.
  it('extraResources matches the shared path constants', () => {
    const entry = (
      packageJson.build.extraResources as Array<{ from: string; to: string }>
    ).find((e) => e.from.includes('webworker'));
    const normalize = (p: string) => p.replace(/^\.\//, '').replace(/\/$/, '');

    expect(entry).toBeDefined();
    expect(normalize(entry!.from)).toBe(PYODIDE_SOURCE_DIR);
    expect(normalize(entry!.to)).toBe(PYODIDE_RESOURCE_DIR);
  });

  // Required at runtime: `indexURL` resolves the interpreter and stdlib through
  // the pyodide:// handler, so a missing one breaks analysis silently.
  it.each([
    'pyodide.mjs',
    'pyodide.asm.js',
    'pyodide.asm.wasm',
    'python_stdlib.zip',
  ])('ships the Pyodide runtime file %s', (filename) => {
    const filePath = path.join(webworkerSrc, 'pyodide', filename);
    expect(
      fs.existsSync(filePath),
      `${filePath} missing — run \`npm run install-pyodide\``
    ).toBe(true);
  });

  it('every wheel named in the package manifest exists on disk', () => {
    const packagesDir = path.join(webworkerSrc, 'packages');
    const manifestPath = path.join(packagesDir, 'manifest.json');

    expect(
      fs.existsSync(manifestPath),
      `${manifestPath} missing — run \`npm run install-pyodide\``
    ).toBe(true);

    const manifest: Record<string, { version: string; filename: string }> =
      JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const entries = Object.entries(manifest);

    // micropip.install() is driven entirely off this manifest; a listed-but-
    // absent wheel fails at MNE import time, deep inside the worker.
    expect(entries.length).toBeGreaterThan(0);
    expect(Object.keys(manifest)).toContain('mne');

    const missing = entries
      .filter(
        ([, { filename }]) => !fs.existsSync(path.join(packagesDir, filename))
      )
      .map(([pkg, { filename }]) => `${pkg} -> ${filename}`);

    expect(missing, 'manifest lists wheels that are not on disk').toEqual([]);
  });
});
