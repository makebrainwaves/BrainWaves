/**
 * Where the Pyodide payload lives, in dev and in a packaged build.
 *
 * These must agree with `build.extraResources` in package.json (JSON can't
 * import, so that pairing is asserted in tests/build.check.ts). A mismatch is
 * invisible in dev and breaks analysis completely in prod — it shipped once.
 */

/** Source tree location; also `extraResources.from`. */
export const PYODIDE_SOURCE_DIR = 'src/renderer/utils/webworker/src';

/** Folder under `process.resourcesPath` in a packaged app; also `extraResources.to`. */
export const PYODIDE_RESOURCE_DIR = 'pyodide';
