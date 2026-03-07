#!/usr/bin/env node
/**
 * Downloads the Pyodide core tarball from GitHub releases and extracts it
 * into the renderer's public directory so Vite serves the runtime as a static
 * asset at /pyodide/… (Vite publicDir → src/renderer/utils/pyodide/src/).
 *
 * The "core" tarball is ~40 MB and includes the runtime plus the most
 * commonly used scientific packages (numpy, scipy, matplotlib, pandas, …).
 * It is much smaller than the full Pyodide build (~500 MB).
 *
 * Usage: node internals/scripts/InstallPyodide.mjs
 * Runs automatically via the postinstall npm hook.
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import { pipeline } from 'stream/promises';
import chalk from 'chalk';
import bz2 from 'unbzip2-stream';
import tar from 'tar-fs';

const PYODIDE_VERSION = '0.29.3';
const TARBALL_NAME = `pyodide-core-${PYODIDE_VERSION}.tar.bz2`;
const TARBALL_URL = `https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/${TARBALL_NAME}`;

// Vite publicDir root — everything here is served verbatim by the dev server.
const PUBLIC_ROOT = path.resolve('src/renderer/utils/pyodide/src');
// The tarball extracts into a `pyodide/` subdirectory, which ends up at:
//   src/renderer/utils/pyodide/src/pyodide/   →   served at /pyodide/
const DEST_DIR = path.join(PUBLIC_ROOT, 'pyodide');
const VERSION_FILE = path.join(DEST_DIR, '.pyodide-version');

// ---------------------------------------------------------------------------
// Network helpers (follow redirects)
// ---------------------------------------------------------------------------

function httpsGetResponse(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'BrainWaves-installer/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(httpsGetResponse(res.headers.location));
        } else {
          resolve(res);
        }
      })
      .on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Skip if this exact version is already extracted.
  if (
    fs.existsSync(VERSION_FILE) &&
    fs.readFileSync(VERSION_FILE, 'utf8').trim() === PYODIDE_VERSION
  ) {
    console.log(
      chalk.green.bold(`Pyodide ${PYODIDE_VERSION} already installed, skipping.`)
    );
    return;
  }

  fs.mkdirSync(PUBLIC_ROOT, { recursive: true });

  const tarballPath = path.join(PUBLIC_ROOT, TARBALL_NAME);

  // Download the tarball if not already cached.
  if (!fs.existsSync(tarballPath)) {
    console.log(
      chalk.blue.bold(`Downloading Pyodide ${PYODIDE_VERSION} core tarball…`)
    );
    const res = await httpsGetResponse(TARBALL_URL);
    if (res.statusCode !== 200) {
      throw new Error(`Failed to download tarball: HTTP ${res.statusCode}`);
    }
    await pipeline(res, fs.createWriteStream(tarballPath));
    console.log(chalk.gray(`  Saved → ${tarballPath}`));
  } else {
    console.log(chalk.gray(`  Tarball already cached, skipping download.`));
  }

  // Extract the tarball.  The archive contains a top-level `pyodide/`
  // directory, so extracting into PUBLIC_ROOT gives us PUBLIC_ROOT/pyodide/.
  console.log(chalk.blue.bold(`Extracting…`));
  await pipeline(
    fs.createReadStream(tarballPath),
    bz2(),
    tar.extract(PUBLIC_ROOT)
  );

  // Stamp the installed version and clean up the cached tarball.
  fs.writeFileSync(VERSION_FILE, PYODIDE_VERSION);
  fs.unlinkSync(tarballPath);

  console.log(
    chalk.green.bold(`Pyodide ${PYODIDE_VERSION} installed successfully.`)
  );
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
