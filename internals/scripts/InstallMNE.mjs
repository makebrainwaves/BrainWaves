#!/usr/bin/env node
/**
 * Downloads everything MNE-Python needs to run offline inside Pyodide:
 *
 *   Part 1 — Pyodide binary packages (from the Pyodide CDN)
 *     Reads pyodide-lock.json that was extracted by InstallPyodide.mjs,
 *     recursively resolves all dependencies of numpy / scipy / matplotlib /
 *     pandas, and downloads each .whl (or .zip) into the same /pyodide/
 *     directory as the runtime.  loadPackage() will find them locally and
 *     will not need to reach the CDN at runtime.
 *
 *   Part 2 — Pure-Python packages (from PyPI)
 *     MNE itself and its pure-Python dependencies (pooch, tqdm, platformdirs)
 *     are not bundled with Pyodide.  These are downloaded as py3-none-any
 *     wheels into src/renderer/utils/webworker/src/packages/ and installed via
 *     micropip at worker startup.  A manifest.json is written there so the
 *     worker knows the exact filenames.
 *
 * Usage: node internals/scripts/InstallMNE.mjs
 * Runs automatically via the postinstall npm hook.
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import chalk from 'chalk';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const PYODIDE_DIR = path.resolve('src/renderer/utils/webworker/src/pyodide');
const LOCK_FILE   = path.join(PYODIDE_DIR, 'pyodide-lock.json');

const PACKAGES_DIR = path.resolve('src/renderer/utils/webworker/src/packages');
const MANIFEST_FILE = path.join(PACKAGES_DIR, 'manifest.json');

// ---------------------------------------------------------------------------
// Root packages whose full transitive dependency tree we need from Pyodide CDN
// ---------------------------------------------------------------------------

const PYODIDE_ROOT_PACKAGES = ['numpy', 'scipy', 'matplotlib', 'pandas'];

// ---------------------------------------------------------------------------
// Pure-Python packages to download from PyPI (not bundled with Pyodide)
// ---------------------------------------------------------------------------

const PYPI_PACKAGES = ['mne', 'pooch', 'tqdm', 'platformdirs'];

// ---------------------------------------------------------------------------
// Shared network helpers
// ---------------------------------------------------------------------------

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    const doGet = (reqUrl) => {
      https
        .get(reqUrl, { headers: { 'User-Agent': 'BrainWaves-installer/1.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            doGet(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`));
            return;
          }
          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
        })
        .on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    };
    doGet(url);
  });
}

function httpsGetText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'BrainWaves-installer/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(httpsGetText(res.headers.location));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { body += c; });
        res.on('end', () => resolve(body));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Part 1 — Pyodide binary packages
// ---------------------------------------------------------------------------

/**
 * Recursively walks the `depends` graph in the lock file and returns every
 * package entry (including root packages) needed to satisfy the given roots.
 * Package name matching is case-insensitive.
 */
function resolveAllDeps(lockPackages, rootNames) {
  // Build a lowercase → original-key index for case-insensitive lookup.
  const index = {};
  for (const key of Object.keys(lockPackages)) {
    index[key.toLowerCase()] = key;
  }

  const resolved = new Set();
  const queue = rootNames.map((n) => n.toLowerCase());

  while (queue.length) {
    const lower = queue.shift();
    const key = index[lower];
    if (!key || resolved.has(key)) continue;
    resolved.add(key);
    for (const dep of lockPackages[key].depends ?? []) {
      queue.push(dep.toLowerCase());
    }
  }

  return [...resolved].map((key) => lockPackages[key]);
}

async function downloadPyodidePackages() {
  if (!fs.existsSync(LOCK_FILE)) {
    console.warn(
      chalk.yellow(
        '  ⚠ pyodide-lock.json not found — run `npm install` first to ' +
        'extract the Pyodide runtime, then re-run this script.'
      )
    );
    return;
  }

  const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));

  // The lock file's info.version may be an internal dev label (e.g. "0.28.0.dev0").
  // Always derive the CDN URL from the installed npm package version instead.
  const npmPkgPath = path.resolve('node_modules/pyodide/package.json');
  const cdnVersion = fs.existsSync(npmPkgPath)
    ? JSON.parse(fs.readFileSync(npmPkgPath, 'utf8')).version
    : lockData.info.version;
  const cdnBase = `https://cdn.jsdelivr.net/pyodide/v${cdnVersion}/full/`;

  const allPkgs = resolveAllDeps(lockData.packages, PYODIDE_ROOT_PACKAGES);

  console.log(
    chalk.blue.bold(
      `Downloading ${allPkgs.length} Pyodide packages from CDN (v${cdnVersion})…`
    )
  );

  for (const pkg of allPkgs) {
    process.stdout.write(chalk.blue(`  ${pkg.name ?? pkg.file_name}: `));

    const dest = path.join(PYODIDE_DIR, pkg.file_name);
    if (fs.existsSync(dest)) {
      console.log(chalk.gray('already present, skipping'));
      continue;
    }

    const url = cdnBase + pkg.file_name;
    try {
      await downloadBinary(url, dest);
      console.log(chalk.green('downloaded'));
    } catch (err) {
      console.log(chalk.red(`FAILED — ${err.message}`));
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
  }
}

// ---------------------------------------------------------------------------
// Part 2 — Pure-Python packages from PyPI
// ---------------------------------------------------------------------------

/**
 * Queries the PyPI JSON API for `packageName` and returns the best
 * pure-Python wheel for the latest release.
 * Preference: py3-none-any > py2.py3-none-any > *-none-any
 */
async function resolvePureWheel(packageName) {
  const raw = await httpsGetText(`https://pypi.org/pypi/${packageName}/json`);
  const data = JSON.parse(raw);
  const version = data.info.version;
  const wheels = data.urls.filter((f) => f.filename.endsWith('.whl'));

  const ranked = [
    wheels.find((f) => f.filename.endsWith('-py3-none-any.whl')),
    wheels.find((f) => f.filename.endsWith('-py2.py3-none-any.whl')),
    wheels.find((f) => f.filename.includes('-none-any.whl')),
  ].filter(Boolean);

  if (ranked.length === 0) {
    throw new Error(
      `No pure-Python wheel found for ${packageName} ${version}. ` +
      `Binary packages must come from the Pyodide CDN.`
    );
  }

  return { version, wheel: ranked[0] };
}

async function installPyPIPackage(packageName, manifest) {
  process.stdout.write(chalk.blue(`  ${packageName}: `));

  let version, wheel;
  try {
    ({ version, wheel } = await resolvePureWheel(packageName));
  } catch (err) {
    console.log(chalk.red(`FAILED — ${err.message}`));
    return;
  }

  const dest = path.join(PACKAGES_DIR, wheel.filename);
  if (fs.existsSync(dest)) {
    console.log(chalk.gray(`${version} already present, skipping`));
    manifest[packageName] = { version, filename: wheel.filename };
    return;
  }

  try {
    await downloadBinary(wheel.url, dest);
    console.log(chalk.green(`${version} downloaded`));
    manifest[packageName] = { version, filename: wheel.filename };
  } catch (err) {
    console.log(chalk.red(`FAILED — ${err.message}`));
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
  }
}

async function downloadPyPIPackages() {
  fs.mkdirSync(PACKAGES_DIR, { recursive: true });

  // Preserve previously downloaded packages already recorded in the manifest.
  let manifest = {};
  if (fs.existsSync(MANIFEST_FILE)) {
    try { manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8')); }
    catch { manifest = {}; }
  }

  console.log(chalk.blue.bold('\nDownloading MNE-Python wheels from PyPI…'));
  for (const pkg of PYPI_PACKAGES) {
    await installPyPIPackage(pkg, manifest);
  }

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(chalk.gray(`  Manifest → ${MANIFEST_FILE}`));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  await downloadPyodidePackages();
  await downloadPyPIPackages();
  console.log(chalk.green.bold('\nAll packages ready.'));
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
