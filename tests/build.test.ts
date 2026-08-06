import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

/**
 * Post-build artifact checks. Runs against `out/` and the postinstall-downloaded
 * Pyodide payload, so it requires `npm run build` (and a full `npm install`)
 * first — see the `test:build` script and the CI step ordering.
 *
 * Purpose: catch the prod-only failure class documented in .llms/learnings.md,
 * where the app builds and the unit suite passes but the packaged renderer
 * cannot load Pyodide because an asset is missing from where the protocol
 * handler looks. Path *spelling* is covered statically by pyodideAssets.test.ts;
 * this file covers actual presence on disk.
 */

// process.cwd(), not __dirname — test files are ESM, where __dirname is undefined.
const repoRoot = process.cwd();
const out = (...p: string[]) => path.join(repoRoot, 'out', ...p);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
);

const webworkerSrc = path.join(
  repoRoot,
  (
    packageJson.build.extraResources as Array<{ from: string; to: string }>
  ).find((entry) => entry.from.includes('webworker'))!.from
);

describe('electron-vite build output', () => {
  it.each([
    ['main', out('main/index.js')],
    ['preload', out('preload/index.js')],
    ['renderer', out('renderer/index.html')],
  ])('emits the %s bundle', (_label, filePath) => {
    expect(
      fs.existsSync(filePath),
      `${filePath} missing — run \`npm run build\` before \`npm run test:build\``
    ).toBe(true);
  });

  it('main entry point matches package.json "main"', () => {
    expect(fs.existsSync(path.join(repoRoot, packageJson.main))).toBe(true);
  });
});

describe('Pyodide payload (postinstall)', () => {
  // Required at runtime in prod: `indexURL` resolves the interpreter and stdlib
  // through the pyodide:// handler, so a missing one breaks analysis silently.
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

    const missing = entries
      .filter(
        ([, { filename }]) => !fs.existsSync(path.join(packagesDir, filename))
      )
      .map(([pkg, { filename }]) => `${pkg} -> ${filename}`);

    expect(missing, 'manifest lists wheels that are not on disk').toEqual([]);
  });

  it('includes mne, the package the whole analysis path depends on', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(webworkerSrc, 'packages/manifest.json'), 'utf8')
    );
    expect(Object.keys(manifest)).toContain('mne');
  });
});
