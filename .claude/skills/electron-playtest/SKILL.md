---
name: electron-playtest
description: Drive the BrainWaves Electron app via CDP — never Vite `:5173`. Launches the dev app, attaches to the Electron window, clicks through screens, checks console errors, takes screenshots, asserts electronAPI + DOM render. Use instead of `/qa` or `/browse` against localhost:5173.
---

# Electron playtest harness

## The problem

`npm run dev` starts a Vite dev server at `http://localhost:5173` AND opens an Electron
window. Opening `:5173` in a browser has **no preload** — `window.electronAPI` is
undefined, `LSLStatusListener` throws, and Pyodide cannot fetch `pyodide://` assets.
The result: `/qa` or `/browse` against Vite crashes immediately.

The **real app** is the Electron window. Drive that.

## Two modes

### Mode A: Quick smoke test (CI / first-pass)

```bash
node tests/electron-smoke.mjs
```

Launches the app, attaches CDP, asserts:
- `window.electronAPI` is present
- React root renders
- Pyodide worker signals ready
- No console errors
- Screenshot captured

Exit code 0 = pass. Used in CI and as a pre-check before interactive playtest.

### Mode B: Interactive agent playtest (browser tool + CDP)

The `browser` tool supports attaching to a running CDP endpoint. This is how an agent
drives the Electron window interactively.

#### Step 1 — Launch Electron with remote debugging

In a terminal hub process or background bash:

```
npm run dev -- --remote-debugging-port=9222
```

This starts both the Vite dev server (renderer) and the Electron window. The
`--remote-debugging-port` flag makes Electron listen on `ws://127.0.0.1:9222`
for CDP connections.

#### Step 2 — Discover the page target

```bash
curl -s http://127.0.0.1:9222/json | jq '.[] | {id, title, url, webSocketDebuggerUrl}'
```

Find the entry whose `type` is `"page"` and `url` starts with `http://localhost:5173`
or `file://`. Copy its `webSocketDebuggerUrl` — that's the WebSocket endpoint
for that specific page.

#### Step 3 — Open a browser tool session attached to the page

```
browser open app: { cdp_url: "ws://127.0.0.1:9222/..." }
```

Replace `...` with the actual WebSocket URL from step 2. The `browser` tool now
controls the Electron window's renderer, not a headless Chromium tab.

**Important**: the browser tool sees Electron as one page. `tab.observe()` and
`tab.screenshot()` work. `tab.goto()` will navigate the Electron window — use it
sparingly (the app is an SPA; route changes are handled by React Router).

#### Step 4 — Playtest

```
tab.screenshot({ fullPage: false })
tab.ariaSnapshot()       # ARIA tree with refs
# Check console errors:
tab.evaluate(() => { /* inspect window.electronAPI, check React state */ })
```

Common assertions to run:

```javascript
// electronAPI present?
!!window.electronAPI?.readWorkspaceRawEEGData

// React root rendered?
document.querySelector('#root')?.children?.length > 0

// Pyodide asset base defined?
typeof window.__ELECTRON_RESOURCE_PATH__ !== 'undefined'

// Check for Redux store (worker readiness, state)
window.__STORE__?.getState()?.pyodide?.isWorkerReady
```

#### Step 5 — Cleanup

Kill the dev server when done:

```bash
pkill -f "electron-vite dev" || true
```

Or stop the hub process.

## Rules

1. **Never** `/qa`, `/qa-only`, or `/browse` against `http://localhost:5173`.
   Always use CDP attach to the Electron window.

2. **Port 9222 may conflict** if another Chrome instance is debugging. Kill it:
   ```bash
   lsof -ti:9222 | xargs kill -9
   ```
   Or set `CDP_PORT=9223` and pass `--remote-debugging-port=9223`.

3. **The Electron window may be slow to load** (Pyodide assets). Wait 3–5 seconds
   after `DOMContentLoaded` before running assertions.

4. **Screenshots capture the visible viewport** (1280×800 default). Scroll or
   resize the window if needed.

5. **Console errors are expected from HMR** (`[HMR]`, Source Map warnings,
   favicon.ico 404) — ignore those. Flag real errors: React render errors,
   IPC timeouts, Pyodide load failures.

The smoke test handles its own app lifecycle (launch via `npm run dev`, cleanup on exit). CI job:

```yaml
- name: Electron playtest
  run: node tests/electron-smoke.mjs
  timeout-minutes: 5
```

macOS CI has a display by default. Linux needs `xvfb-run`:

```yaml
- name: Electron playtest
  run: xvfb-run --auto-servernum node tests/electron-smoke.mjs
  timeout-minutes: 5
```

The script auto-kills the dev server on completion. No separate `npm run dev &` needed — the script spawns it.

The smoke test runs in CI via:

```yaml
- name: Electron playtest
  run: |
    npm run dev -- --remote-debugging-port=9222 &
    node tests/electron-smoke.mjs
```

macOS CI has a display. Linux needs `xvfb-run`:

```yaml
- name: Electron playtest
  run: |
    xvfb-run --auto-servernum npm run dev -- --remote-debugging-port=9222 &
    node tests/electron-smoke.mjs
```

The script auto-kills the dev server on completion.