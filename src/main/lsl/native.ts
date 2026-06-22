/**
 * Lazy, fail-safe loader for the native LSL bindings.
 *
 * `node-labstreaminglayer` loads liblsl via koffi (FFI) at require time. On a
 * machine where liblsl is missing (e.g. Apple Silicon without the Homebrew
 * build) that require throws. LSL is an advanced, opt-in capability — Muse and
 * Neurosity work entirely without it — so a failed load must never crash app
 * startup. We attempt the require once, swallow any failure, and report
 * availability so callers (outlets, inlets, the renderer feature-gate) can
 * degrade gracefully.
 */
import log from 'electron-log';

type LSLModule = typeof import('node-labstreaminglayer');

let cached: LSLModule | null = null;
let attempted = false;

/**
 * Returns the loaded LSL module, or null if liblsl could not be loaded.
 * The load is attempted lazily on first call and the result is memoized.
 */
export function loadLSL(): LSLModule | null {
  if (attempted) return cached;
  attempted = true;
  try {
    // require (not a static import) so a missing liblsl degrades to a disabled
    // feature instead of throwing during module evaluation at startup.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('node-labstreaminglayer') as LSLModule;
    log.info('[lsl] native module loaded — LSL features enabled');
  } catch (err) {
    cached = null;
    log.warn(
      '[lsl] node-labstreaminglayer unavailable — LSL features disabled ' +
        '(expected if liblsl is not installed):',
      err instanceof Error ? err.message : err
    );
  }
  return cached;
}

export function isLSLAvailable(): boolean {
  return loadLSL() !== null;
}
