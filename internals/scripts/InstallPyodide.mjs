#!/usr/bin/env node
/**
 * Copies the Pyodide runtime from the installed npm package into the renderer's
 * publicDir so Vite can serve it as static assets.
 *
 * Source:  node_modules/pyodide/
 * Dest:    src/renderer/utils/pyodide/src/pyodide/
 *
 * Key files copied:
 *   pyodide.mjs          – ESM entry point (imported by the web worker via npm)
 *   pyodide.js           – UMD fallback
 *   pyodide.asm.js       – compiled Python interpreter
 *   pyodide.asm.wasm     – WebAssembly binary
 *   python_stdlib.zip    – Python standard library
 *   pyodide-lock.json    – package registry (read by InstallMNE.mjs)
 *
 * Intentionally skipped:
 *   package.json         – would make Vite treat the dir as an npm package
 *                          and attempt to transform pyodide.mjs as a module
 *   *.d.ts               – TypeScript declaration files, not needed at runtime
 *   *.html               – console demo pages
 *   README.md            – documentation
 *   *.map                – source maps (large, optional for debugging)
 *
 * A version stamp (.pyodide-version) is written so subsequent runs are skipped
 * when the installed version has not changed.
 *
 * Usage: node internals/scripts/InstallPyodide.mjs
 * Runs automatically via the postinstall npm hook.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import chalk from 'chalk';

const _require = createRequire(import.meta.url);

const DEST_DIR     = path.resolve('src/renderer/utils/pyodide/src/pyodide');
const VERSION_FILE = path.join(DEST_DIR, '.pyodide-version');

// Files to exclude from the copy.
const SKIP_EXTENSIONS = new Set(['.d.ts', '.map', '.html', '.md']);
const SKIP_FILES      = new Set(['package.json', 'README.md']);

function shouldSkip(filename) {
  if (SKIP_FILES.has(filename)) return true;
  for (const ext of SKIP_EXTENSIONS) {
    if (filename.endsWith(ext)) return true;
  }
  return false;
}

async function main() {
  // Locate the pyodide package directory via Node's module resolution.
  let pyodideDir;
  try {
    pyodideDir = path.dirname(_require.resolve('pyodide/package.json'));
  } catch {
    console.error(
      chalk.red(
        'pyodide not found in node_modules. Run `npm install` first.'
      )
    );
    process.exit(1);
  }

  const version = JSON.parse(
    fs.readFileSync(path.join(pyodideDir, 'package.json'), 'utf8')
  ).version;

  // Skip if this version was already installed.
  if (
    fs.existsSync(VERSION_FILE) &&
    fs.readFileSync(VERSION_FILE, 'utf8').trim() === version
  ) {
    console.log(chalk.gray(`Pyodide ${version} already installed — skipping.`));
    return;
  }

  console.log(
    chalk.blue.bold(`Installing Pyodide ${version} from node_modules…`)
  );
  fs.mkdirSync(DEST_DIR, { recursive: true });

  const files = fs.readdirSync(pyodideDir);
  for (const file of files) {
    if (shouldSkip(file)) continue;

    const src  = path.join(pyodideDir, file);
    const dest = path.join(DEST_DIR, file);

    if (fs.statSync(src).isDirectory()) continue;

    process.stdout.write(chalk.blue(`  ${file}: `));
    fs.copyFileSync(src, dest);
    console.log(chalk.green('copied'));
  }

  fs.writeFileSync(VERSION_FILE, version);
  console.log(
    chalk.green.bold(`\nPyodide ${version} ready at ${DEST_DIR}`)
  );
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
