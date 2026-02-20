/**
 * Post-install patches for dependencies that have browser-incompatible code.
 *
 * NOTE: plotly.js was upgraded from v1 (bundled d3 v3) to v2 (d3 v6, pure ESM),
 * so the previous `this.document` / `this.navigator` patches are no longer needed.
 *
 * This file is kept as a placeholder for any future dependency patches and is
 * still wired into `postinstall` and `dev` npm scripts.
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('[patchDeps] No patches needed.');
