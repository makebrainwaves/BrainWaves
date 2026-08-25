/**
 * Electron playtest smoke test.
 *
 * Launches the dev-build Electron app with --remote-debugging-port on a
 * dynamically allocated port and a temporary --user-data-dir (avoids the
 * single-instance lock conflict with a running app). Attaches CDP to the
 * renderer page, runs assertions, and takes a screenshot.
 *
 * Usage:
 *   node tests/electron-smoke.mjs
 *   SMOKE_TIMEOUT=180 node tests/electron-smoke.mjs
 *
 * Exit code: 0 on pass, 1 on fail.
 *
 * Design:
 *   - Zero npm dependencies (native WebSocket + fetch, Node 21+).
 *   - Allocates a free TCP port for CDP, temp --user-data-dir for the spawn.
 *   - Polls /json/list until a page target appears.
 *   - Kills the entire spawned process group on exit (detached + kill(-pgid)).
 *   - Installs console + exceptionThrown listeners BEFORE Runtime.enable.
 *   - Asserts: electronAPI, React root, Pyodide worker readiness, screenshot.
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TIMEOUT_MS =
  (parseInt(process.env.SMOKE_TIMEOUT ?? '180', 10)) * 1000;
const POLL_INTERVAL = 800;
const SCREENSHOT_PATH = resolve(ROOT, '.gstack/electron-smoke-screenshot.png');

// Temp user-data-dir so this spawn doesn't conflict with a running BrainWaves
// instance (single-instance lock in src/main/index.ts:53-54).
const USER_DATA_DIR = mkdtempSync(resolve(ROOT, '.gstack/playtest-'));

// ---------------------------------------------------------------------------
// Port allocation
// ---------------------------------------------------------------------------

/** Bind to port 0 to get a free port, close it, return the port number. */
async function findFreePort() {
  const existing = process.env.CDP_PORT
    ? parseInt(process.env.CDP_PORT, 10)
    : null;
  if (existing) return existing;
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Poll CDP /json/list until a page target appears. */
async function pollCdp(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (!resp.ok) {
        await sleep(POLL_INTERVAL);
        continue;
      }
      const targets = await resp.json();
      const hasAppPage = targets.some(
        (t) =>
          t.type === 'page' &&
          !t.url.startsWith('devtools://') &&
          !t.url.startsWith('chrome-error://') &&
          !t.url.startsWith('chrome-extension://') &&
          (t.url.startsWith('http://localhost:5') ||
            t.url.startsWith('file://'))
      );
      if (hasAppPage) return targets;
    } catch {
      /* CDP not ready yet */
    }
    await sleep(POLL_INTERVAL);
  }
  throw new Error(
    `CDP port ${port}: no app page target appeared within ${timeoutMs}ms`
  );
}

/** Pick the first viable app page target. */
function pickAppTarget(targets) {
  return (
    targets.find(
      (t) =>
        t.type === 'page' &&
        !t.url.startsWith('devtools://') &&
        !t.url.startsWith('chrome-error://') &&
        !t.url.startsWith('chrome-extension://') &&
        (t.url.startsWith('http://localhost:5') ||
          t.url.startsWith('file://'))
    ) ?? null
  );
}

/** Send a CDP message and resolve on matching response. Timer always cleared. */
function cdpSend(ws, msg, sessionId) {
  const payload = typeof msg === 'string' ? JSON.parse(msg) : msg;
  return new Promise((resolve, reject) => {
    const id = payload.id ?? Math.floor(Math.random() * 1e9);
    const toSend = { ...payload, id };
    if (sessionId) toSend.sessionId = sessionId;

    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`CDP timeout for id=${id} (${payload.method})`));
    }, 15_000);

    const handler = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data.toString());
      } catch {
        return;
      }
      if (parsed.id === id) {
        clearTimeout(timer);
        ws.removeEventListener('message', handler);
        if (parsed.error) reject(new Error(parsed.error.message));
        else resolve(parsed.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify(toSend));
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 0. Allocate a free CDP port
  const cdpPort = await findFreePort();
  console.log(`[smoke] CDP port ${cdpPort}`);

  const errors = [];
  let appProcess = null;
  const startTime = Date.now();

  // 1. Launch the dev app. BW_PLAYTEST_USER_DATA env var redirects userData so the spawn gets its own single-instance lock scope
  //    detached spawns a new process group so we can kill -PGID the whole tree on cleanup.
  console.log(`[smoke] Launching npm run dev (port ${cdpPort})`);
  appProcess = spawn(
    'npm',
    ['run', 'dev', '--', `--remote-debugging-port=${cdpPort}`],
    {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BW_PLAYTEST_USER_DATA: USER_DATA_DIR },
      detached: true,
    }
  );

  const pgid = appProcess.pid;

  appProcess.stdout.on('data', (d) => process.stdout.write(`[app:out] ${d}`));
  appProcess.stderr.on('data', (d) => process.stderr.write(`[app:err] ${d}`));
  appProcess.on('exit', (code, sig) => {
    if (sig === 'SIGTERM') return;
    console.log(`[smoke] App exited: code=${code} signal=${sig}`);
  });

  // await-exit helper: resolve when the app process exits, up to deadline
  const awaitAppExit = (deadlineMs) => {
    if (!appProcess || appProcess.killed) return Promise.resolve();
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Force-kill on deadline
        try { if (pgid) process.kill(-pgid, 'SIGKILL'); } catch { /* ok */ }
        resolve();
      }, deadlineMs);
      appProcess.once('exit', () => { clearTimeout(timeout); resolve(); });
    });
  };

  // Cleanup: kill whole process group + remove temp user-data-dir
  const cleanup = () => {
    if (appProcess && !appProcess.killed && pgid) {
      try {
        process.kill(-pgid, 'SIGTERM');
      } catch {
        /* may already be gone */
      }
    }
    try {
      rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch {
      /* ok */
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(1);
  });

  const remaining = () => Math.max(0, startTime + TIMEOUT_MS - Date.now());

  try {
    // 2. Wait for CDP endpoint with a page target
    console.log('[smoke] Waiting for app page...');
    const targets = await pollCdp(cdpPort, remaining());

    // 3. Pick the app page target
    const pageTarget = pickAppTarget(targets);
    if (!pageTarget) {
      const urls = targets
        .map((t) => `  ${t.id}: ${t.type} ${(t.url ?? '').slice(0, 120)}`)
        .join('\n');
      throw new Error(`No app page target.\nTargets:\n${urls}`);
    }
    console.log(
      `[smoke] Page: ${pageTarget.title || '(no title)'} @ ${(
        pageTarget.url ?? ''
      ).slice(0, 120)}`
    );

    // 4. Connect via WebSocket
    console.log('[smoke] Connecting...');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = (e) => reject(new Error(`WS: ${e.message}`));
      ws.onclose = (e) => {
        if (e.code !== 1000) reject(new Error(`WS closed: ${e.code}`));
      };
    });
    console.log('[smoke] Connected');

    // 5. Listeners BEFORE Runtime.enable (catches early errors)
    const consoleErrors = [];
    const consoleWarnings = [];
    const exceptions = [];
    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data.toString());
        if (msg.method === 'Runtime.consoleAPICalled') {
          const { type, args } = msg.params;
          const text = args
            .map((a) => a.value ?? a.description ?? String(a))
            .join(' ');
          if (type === 'error') consoleErrors.push(text);
          else if (type === 'warn') consoleWarnings.push(text);
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const { exceptionDetails } = msg.params;
          const text =
            exceptionDetails?.text ??
            exceptionDetails?.exception?.description ??
            JSON.stringify(exceptionDetails);
          exceptions.push(text);
        }
      } catch {
        /* ignore */
      }
    });

    // 6. Enable domains
    console.log('[smoke] Enabling Runtime + Page...');
    await cdpSend(ws, { id: 1, method: 'Runtime.enable' });
    await cdpSend(ws, { id: 2, method: 'Page.enable' });

    // 7. Wait for renderer init (Pyodide ~30-60s, React mount faster)
    const waitSec = Math.min(Math.round(remaining() / 1000 / 2), 60);
    console.log(`[smoke] Waiting ${waitSec}s for init...`);
    await sleep(waitSec * 1000);

    // 8. Assertions
    console.log('[smoke] Assertions...');

    // 8a. electronAPI
    const apiResult = await cdpSend(ws, {
      id: 4,
      method: 'Runtime.evaluate',
      params: {
        expression:
          'window.electronAPI?.readWorkspaceRawEEGData ? "PRESENT" : "MISSING"',
        awaitPromise: true,
      },
    });
    if (apiResult.result?.value !== 'PRESENT') {
      errors.push(
        `FAIL: electronAPI missing (${JSON.stringify(apiResult.result?.value)})`
      );
    } else {
      console.log('[smoke]  \u2713 electronAPI');
    }

    // 8b. Resource path
    const resResult = await cdpSend(ws, {
      id: 5,
      method: 'Runtime.evaluate',
      params: {
        expression:
          'window.__ELECTRON_RESOURCE_PATH__ ' +
          '? "RP:" + window.__ELECTRON_RESOURCE_PATH__ : "MISSING"',
        awaitPromise: false,
      },
    });
    const resVal = resResult.result?.value ?? 'NO_VALUE';
    if (resVal === 'MISSING' || resVal === 'NO_VALUE') {
      errors.push('FAIL: resource path missing');
    } else {
      console.log('[smoke]  \u2713 resource path');
    }

    // 8c. Worker readiness
    const workerDeadline = Date.now() + Math.min(remaining(), 60_000);
    let workerReady = false;
    while (Date.now() < workerDeadline) {
      const wr = await cdpSend(ws, {
        id: 7,
        method: 'Runtime.evaluate',
        params: {
          expression:
            'try{window.__STORE__.getState().pyodide?.isWorkerReady}catch(e){null}',
          awaitPromise: false,
        },
      });
      if (wr.result?.value === true) {
        workerReady = true;
        break;
      }
      await sleep(1000);
    }
    if (!workerReady) {
      const stateCheck = await cdpSend(ws, {
        id: 8,
        method: 'Runtime.evaluate',
        params: {
          expression:
            'try{' +
            'const s=window.__STORE__.getState().pyodide;' +
            'JSON.stringify({worker:!!s.worker,ready:s.isWorkerReady})' +
            '}catch(e){e.message}',
          awaitPromise: false,
        },
      });
      errors.push(
        `FAIL: worker not ready (state: ${stateCheck.result?.value ?? 'store inaccessible'})`
      );
    } else {
      console.log('[smoke]  \u2713 worker ready');
    }

    // 8d. Console errors + exceptions (filter HMR/sourcemap noise)
    const fatalConsole = consoleErrors.filter(
      (e) =>
        !e.includes('[HMR]') &&
        !e.includes('favicon.ico') &&
        !e.includes('Source map') &&
        !e.includes('DevTools') &&
        !e.includes('Failed to load resource')
    );
    const allFatal = [...fatalConsole, ...exceptions];
    if (allFatal.length > 0) {
      errors.push(`FAIL: ${allFatal.length} error(s):`);
      allFatal.forEach((e) => errors.push(`  \u274c ${e.slice(0, 300)}`));
    } else {
      console.log('[smoke]  \u2713 no fatal errors');
    }

    // 8e. React root
    const domResult = await cdpSend(ws, {
      id: 9,
      method: 'Runtime.evaluate',
      params: {
        expression: 'document.querySelector("#root") ? "OK" : "NO_ROOT"',
        awaitPromise: false,
      },
    });
    if (domResult.result?.value !== 'OK') {
      errors.push('FAIL: #root not found');
    } else {
      console.log('[smoke]  \u2713 React root');
    }

    // 9. Screenshot
    console.log('[smoke] Screenshot...');
    const ss = await cdpSend(ws, {
      id: 10,
      method: 'Page.captureScreenshot',
      params: { format: 'png', fromSurface: true },
    });
    if (ss?.data) {
      writeFileSync(SCREENSHOT_PATH, Buffer.from(ss.data, 'base64'));
      console.log(`[smoke]  \u2713 screenshot -> ${SCREENSHOT_PATH}`);
    } else {
      errors.push('FAIL: screenshot empty');
    }

    // 10. Report
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (errors.length > 0) {
      console.log(
        `\n[smoke] \u274c FAIL after ${elapsed}s \u2014 ${errors.length} failure(s):`
      );
      errors.forEach((e) => console.log(`  ${e}`));
      process.exitCode = 1;
    } else {
      console.log(`\n[smoke] \u2705 PASS in ${elapsed}s`);
    }
  } catch (err) {
    console.error(`\n[smoke] \u274c FAIL:`, err);
    process.exitCode = 1;
    } finally {
    cleanup();
    // Wait for the app process to exit (up to 6s total: 1s grace + 5s SIGKILL).
    await awaitAppExit(5000);
    process.exit(process.exitCode ?? 0);
  }
}
main();