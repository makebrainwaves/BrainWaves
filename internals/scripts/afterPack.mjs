/**
 * electron-builder afterPack hook — make the bundled macOS liblsl self-contained.
 *
 * Why this exists
 * ---------------
 * On Apple Silicon, `patchDeps.mjs` points the bundled liblsl at the Homebrew
 * build (node-labstreaminglayer ships only an x86_64 dylib). electron-builder
 * dereferences that symlink at package time, so the arm64 liblsl.dylib lands in
 * the app as a real file — BUT the Homebrew build is NOT self-contained: it
 * dynamically links `/opt/homebrew/opt/pugixml/lib/libpugixml.1.dylib`, a path
 * that won't exist on a user's machine. Result: `dlopen(liblsl)` fails on any
 * clean Mac, so LSL silently no-ops in distributed builds.
 *
 * This hook copies each external (Homebrew/MacPorts) dependency next to liblsl
 * inside the unpacked bundle and rewrites the references to `@loader_path`, so
 * the dylib resolves its deps from its own directory. Re-signs ad-hoc afterward
 * because install_name_tool invalidates the signature. The scan is recursive, so
 * a future liblsl build with deeper dependency chains is handled too. macOS-only
 * (uses install_name_tool / codesign), and it couples packaging to the build
 * machine having the Homebrew deps — the same assumption patchDeps makes for dev.
 *
 * Remove when this is true
 * ------------------------
 * node-labstreaminglayer ships a self-contained arm64 macOS liblsl (pugixml
 * statically linked, or otherwise no absolute /opt/homebrew deps), or we vendor
 * such a build ourselves. At that point `patchDeps.mjs` no longer needs the
 * Homebrew symlink and the packaged dylib has no external paths to rewrite —
 * confirm with `otool -L` showing only @loader_path/@rpath + /usr/lib, then
 * delete this hook and its `build.afterPack` wiring in package.json.
 */
import { execFileSync } from 'child_process';
import { copyFileSync, chmodSync, existsSync, realpathSync } from 'fs';
import { join, basename } from 'path';

// Load-path prefixes that mean "external, won't exist on a user's machine".
// System frameworks (/usr/lib, /System) and already-relative refs (@...) are
// portable and left alone.
const EXTERNAL_PREFIXES = ['/opt/homebrew/', '/usr/local/', '/opt/local/'];

function otoolDeps(dylib) {
  const out = execFileSync('otool', ['-L', dylib], { encoding: 'utf8' });
  // Line 0 is the file-path header; each remaining line is "\t<path> (compat…)".
  return out
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);
}

// Recursively bundle `dylib`'s external deps into `destDir`, rewriting every
// reference (and each lib's own id) to @loader_path, then re-sign ad-hoc.
function makeSelfContained(dylib, destDir, visited = new Set()) {
  if (visited.has(dylib)) return;
  visited.add(dylib);

  // Point the lib's own id at @loader_path — harmless for liblsl itself, and
  // required for copied deps so anything linking them resolves in-bundle.
  execFileSync('install_name_tool', [
    '-id',
    `@loader_path/${basename(dylib)}`,
    dylib,
  ]);

  for (const dep of otoolDeps(dylib)) {
    if (!EXTERNAL_PREFIXES.some((prefix) => dep.startsWith(prefix))) continue;
    const depName = basename(dep);
    const bundledDep = join(destDir, depName);
    // Copy the real target (follows the Homebrew symlink chain).
    copyFileSync(realpathSync(dep), bundledDep);
    chmodSync(bundledDep, 0o755);
    execFileSync('install_name_tool', [
      '-change',
      dep,
      `@loader_path/${depName}`,
      dylib,
    ]);
    makeSelfContained(bundledDep, destDir, visited);
  }

  // install_name_tool invalidates the code signature — re-sign ad-hoc.
  execFileSync('codesign', ['--force', '--sign', '-', dylib]);
}

export default async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const prebuild = join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    'Contents/Resources/app.asar.unpacked/node_modules/node-labstreaminglayer/prebuild'
  );
  const liblsl = join(prebuild, 'liblsl.dylib');

  if (!existsSync(liblsl)) {
    throw new Error(
      `afterPack: expected bundled liblsl at ${liblsl}, not found — did asarUnpack or patchDeps change?`
    );
  }

  console.log('[afterPack] Making liblsl.dylib self-contained:', liblsl);
  makeSelfContained(liblsl, prebuild);
  console.log('[afterPack] liblsl external deps bundled + re-signed.');
}
