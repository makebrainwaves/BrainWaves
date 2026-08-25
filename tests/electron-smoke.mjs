/**
 * Electron playtest smoke test.
 *
 * Launches the dev-build Electron app with --remote-debugging-port, attaches
 * CDP to the renderer page, runs assertions, and takes a screenshot.
 *
 * Usage:
 *   node tests/electron-smoke.mjs
 *   SMOKE_TIMEOUT=60 node tests/electron-smoke.mjs
 *
 * Exit code: 0 on pass, 1 on fail.
 *
 * Design:
 *   - Native WebSocket (Node 21+) + fetch — zero npm dependencies.
 *   - Polls CDP /json/list until a non-DevTools page target appears.
 *   - Asserts electronAPI, resource path, React root, screenshot.
 *   - Filters HMR/sourcemap noise from console error check.
 *   - Kills child process on exit via SIGTERM + 5s SIGKILL fallback.
 */

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TIMEOUT_MS =
  (parseInt(process.env.SMOKE_TIMEOUT ?? '90', 10)) * 1000;
const CDP_PORT = parseInt(process.env.CDP_PORT ?? '9222', 10);
const POLL_INTERVAL = 500;
const SCREENSHOT_PATH = resolve(ROOT, '.gstack/electron-smoke-screenshot.png');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const cdpUrl = (port) => `http://127.0.0.1:${port}`;

/** Poll CDP /json/list until a non-DevTools page target appears. */
async function pollCdp(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const resp = await fetch(`${cdpUrl(port)}/json/list`);
      if (!resp.ok) {
        await sleep(POLL_INTERVAL);
        continue;
      }
      const targets = await resp.json();
      const hasAppPage = targets.some(
        (t) =>
          t.type === 'page' &&
          (t.url.startsWith('http://localhost:5173') ||
            t.url.startsWith('file://'))
      );
      if (hasAppPage) return targets;
    } catch {
      /* CDP not ready */
    }
    await sleep(POLL_INTERVAL);
  }
  throw new Error(
    `CDP endpoint at port ${port}: no app page target appeared within ${timeoutMs}ms`
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
  const errors = [];
  let appProcess = null;
  const startTime = Date.now();

  // 1. Launch Electron with remote debugging
  console.log(`[smoke] Launching: npm run dev (CDP port ${CDP_PORT})`);
  appProcess = spawn(
    'npm',
    ['run', 'dev', '--', `--remote-debugging-port=${CDP_PORT}`],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: process.env }
  );

  appProcess.stdout.on('data', (d) => process.stdout.write(`[app:out] ${d}`));
  appProcess.stderr.on('data', (d) => process.stderr.write(`[app:err] ${d}`));
  appProcess.on('exit', (code, sig) => {
    if (sig === 'SIGTERM') return;
    console.log(`[smoke] App exited unexpectedly: code=${code} signal=${sig}`);
  });

  const cleanup = () => {
    if (appProcess && !appProcess.killed) {
      appProcess.kill('SIGTERM');
      setTimeout(() => {
        if (appProcess && !appProcess.killed) appProcess.kill('SIGKILL');
      }, 5000).unref();
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
    // 2. Wait for CDP endpoint with an app page target
    console.log('[smoke] Waiting for app page target...');
    const targets = await pollCdp(CDP_PORT, remaining());

    // 3. Pick the app page target (same predicate as pollCdp)
    const pageTarget = targets.find(
      (t) =>
        t.type === 'page' &&
        (t.url.startsWith('http://localhost:5173') ||
          t.url.startsWith('file://'))
    );
    if (!pageTarget) {
      const urls = targets
        .map((t) => `  ${t.id}: ${t.type} ${(t.url ?? '').slice(0, 120)}`)
        .join('\n');
      throw new Error(`No app page target found.\nAvailable:\n${urls}`);
    }
    console.log(
      `[smoke] Page: ${pageTarget.title || '(no title)'} @ ${(
        pageTarget.url ?? ''
      ).slice(0, 120)}`
    );

    // 4. Connect via WebSocket
    console.log('[smoke] Connecting to page CDP...');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = (e) => reject(new Error(`WS error: ${e.message}`));
      ws.onclose = (e) => {
        if (e.code !== 1000) reject(new Error(`WS closed: ${e.code}`));
      };
    });
    console.log('[smoke] Connected');

    // 5. Enable domains
    await cdpSend(ws, { id: 1, method: 'Runtime.enable' });
    await cdpSend(ws, { id: 2, method: 'Page.enable' });

    // 6. Collect console messages
    const consoleErrors = [];
    const consoleWarnings = [];
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
        }
      } catch {
        /* ignore */
      }
    });

    // 7. Give renderer time (Pyodide init, React mount)
    console.log('[smoke] Waiting for renderer initialisation...');
    await sleep(5000);

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
        `FAIL: window.electronAPI missing (${JSON.stringify(apiResult.result?.value)})`
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
      errors.push('FAIL: __ELECTRON_RESOURCE_PATH__ missing');
    } else {
      console.log('[smoke]  \u2713 resource path');
    }

    // 8c. Console errors (filter HMR/sourcemap/favicon/DevTools noise)
    const fatal = consoleErrors.filter(
      (e) =>
        !e.includes('[HMR]') &&
        !e.includes('favicon.ico') &&
        !e.includes('Source map') &&
        !e.includes('DevTools') &&
        !e.includes('Failed to load resource')
    );
    if (fatal.length > 0) {
      errors.push(`FAIL: ${fatal.length} console error(s):`);
      fatal.forEach((e) => errors.push(`  \u274c ${e}`));
    } else {
      console.log('[smoke]  \u2713 no fatal console errors');
    }

    // 8d. React root
    const domResult = await cdpSend(ws, {
      id: 6,
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

    // 8e. Worker readiness — poll until Pyodide worker is fully initialised
    //     (loadUtils completes and dispatches SetWorkerReady).
    const workerDeadline = Date.now() + 60_000;
    let workerReady = false;
    const storeAccessExpr =
      'try{window.__STORE__.getState().pyodide.isWorkerReady}catch(e){null}';
    while (Date.now() < workerDeadline) {
      const wr = await cdpSend(ws, {
        id: 8,
        method: 'Runtime.evaluate',
        params: { expression: storeAccessExpr, awaitPromise: false },
      });
      if (wr.result?.value === true) {
        workerReady = true;
        break;
      }
      await sleep(1000);
    }
    if (!workerReady) {
      errors.push('FAIL: Pyodide worker did not signal ready within 60s');
    } else {
      console.log('[smoke]  \u2713 worker ready');
    }

    // 9. Screenshot
    console.log('[smoke] Screenshot...');
    const ss = await cdpSend(ws, {
      id: 7,
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
        `\n[smoke] \u274c FAIL after ${elapsed}s — ${errors.length} failure(s):`
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
    await sleep(500);
    process.exit(process.exitCode ?? 0);
  }
}

main();