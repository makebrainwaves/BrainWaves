#!/usr/bin/env node
/**
 * Downloads MNE-Python and its pure-Python dependencies from PyPI as wheel
 * files for offline use with Pyodide.  Binary dependencies (numpy, scipy,
 * matplotlib, pandas) are already included via the `pyodide` npm package and
 * do NOT need to be downloaded here.
 *
 * Downloaded wheels are saved to:
 *   src/renderer/utils/pyodide/src/packages/
 *
 * A manifest.json is written there so the web worker knows which filenames
 * to pass to micropip.install() at startup.
 *
 * Usage: node internals/scripts/InstallMNE.mjs
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import chalk from 'chalk';

const PACKAGES_DIR = path.resolve(
  'src/renderer/utils/pyodide/src/packages'
);
const MANIFEST_FILE = path.join(PACKAGES_DIR, 'manifest.json');

/**
 * Pure-Python packages required by MNE that are not bundled with Pyodide.
 * Each entry is resolved against the PyPI JSON API to find the latest
 * pure-Python wheel (py3-none-any or py2.py3-none-any).
 */
const PACKAGES_TO_DOWNLOAD = [
  'mne',
  'pooch',
  'tqdm',
  'platformdirs',
];

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'BrainWaves-installer/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpsGet(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    const doGet = (reqUrl) => {
      https.get(reqUrl, { headers: { 'User-Agent': 'BrainWaves-installer/1.0' } }, (res) => {
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
      }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    };
    doGet(url);
  });
}

// ---------------------------------------------------------------------------
// PyPI helpers
// ---------------------------------------------------------------------------

/**
 * Returns the best pure-Python wheel for the latest release of `packageName`.
 * Preference: py3-none-any > py2.py3-none-any > *-none-any
 */
async function resolvePureWheel(packageName) {
  const raw = await httpsGet(`https://pypi.org/pypi/${packageName}/json`);
  const data = JSON.parse(raw);
  const version = data.info.version;
  const urls = data.urls; // files for the latest release

  const wheels = urls.filter((f) => f.filename.endsWith('.whl'));

  const ranked = [
    wheels.find((f) => f.filename.endsWith('-py3-none-any.whl')),
    wheels.find((f) => f.filename.endsWith('-py2.py3-none-any.whl')),
    wheels.find((f) => f.filename.includes('-none-any.whl')),
  ].filter(Boolean);

  if (ranked.length === 0) {
    throw new Error(
      `No pure-Python wheel found for ${packageName} ${version}.  ` +
      `Binary packages must come from the Pyodide npm bundle.`
    );
  }

  return { version, wheel: ranked[0] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function installPackage(packageName, manifest) {
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

async function main() {
  fs.mkdirSync(PACKAGES_DIR, { recursive: true });

  // Preserve any previously downloaded packages in the manifest.
  let manifest = {};
  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    } catch {
      manifest = {};
    }
  }

  console.log(chalk.blue.bold('Downloading MNE-Python wheels from PyPI…'));
  for (const pkg of PACKAGES_TO_DOWNLOAD) {
    await installPackage(pkg, manifest);
  }

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(chalk.green.bold('\nAll MNE wheels ready.'));
  console.log(chalk.gray(`Manifest → ${MANIFEST_FILE}`));
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
