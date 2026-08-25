---
name: electron-playtest
description: Smoke-test the BrainWaves Electron app via CDP — never Vite `:5173`. Launches the dev app, asserts preload/Pyodide/React, captures screenshot. Use instead of `/qa` or `/browse` against localhost:5173.
---

# Electron playtest harness

## The problem

`npm run dev` starts a Vite dev server at `http://localhost:5173` AND opens an Electron
window. Opening `:5173` in a browser has **no preload** — `window.electronAPI` is
undefined, `LSLStatusListener` throws, and Pyodide cannot fetch `pyodide://` assets.
The result: `/qa` or `/browse` against Vite crashes immediately.

The **real app** is the Electron window.

## Automated smoke test (recommended)

```bash
node tests/electron-smoke.mjs
```

Launches the app, attaches CDP to the renderer, and asserts:
- `window.electronAPI` is present (preload injected)
- `window.__ELECTRON_RESOURCE_PATH__` is set
- Pyodide worker signals `isWorkerReady`
- No console errors or `Runtime.exceptionThrown`
- React root renders
- Screenshot captured (`.gstack/electron-smoke-screenshot.png`)

Exit code 0 = pass, 1 = fail.

### CI usage

The script handles its own lifecycle (spawns `npm run dev`, cleans up on exit).

```yaml
- name: Electron playtest
  run: node tests/electron-smoke.mjs
  timeout-minutes: 15
```

Linux needs `xvfb-run`:

```yaml
- name: Electron playtest
  run: xvfb-run --auto-servernum node tests/electron-smoke.mjs
  timeout-minutes: 15
```

### Smoke test guardrails

- Dynamic CDP port (no conflict with other Chrome instances)
- `BW_PLAYTEST_USER_DATA` env var redirects userData so the spawned app gets its own
  single-instance lock scope (doesn't interfere with a running BrainWaves)
- `detached` spawn + process-group `SIGTERM`/`SIGKILL` cleanup — no orphaned processes
- Console + exception listeners installed BEFORE `Runtime.enable` (catches early errors)
- Temp directory cleaned up on exit

## Interpreting results

If the smoke test passes, the app boots correctly: preload wired, React mounted,
Pyodide worker initialised, no renderer crashes. This catches the class of regression
where "the app builds but the packaged app silently fails" — but in dev mode.

If it fails, check:
1. **electronAPI missing** → preload not injecting. Check `src/preload/index.ts`.
2. **worker not ready** → Pyodide asset fetch or init failed (missing `.whl` files,
   `pyodide://` protocol handler misconfigured). Run `npm run install-pyodide`.
3. **Console errors / exceptions** → renderer crash. Look at the error text in the
   output — `LSLStatusListener` throws are expected in headless, React/worker errors
   are real.
4. **Screenshot** — view `.gstack/electron-smoke-screenshot.png` to verify the app
   rendered its initial state (sidebar, workspace list, experiment cards).

## Inspecting the screenshot

After the smoke test passes, inspect the captured screenshot:

```
inspect_image path: ".gstack/electron-smoke-screenshot.png" question: "Does the app UI look correct? List any visible layout issues."
```

This is especially valuable for catching visual regressions that don't throw errors
(e.g., missing sidebar, blank content area, broken CSS).

## Manual playtest

For interactive human QA (clicking through experiments, connecting Muse), the app
opens normally on your display:

```bash
npm run dev
```

No CDP port needed. Use the app as a user would.

## Rules

1. **Never** `/qa`, `/qa-only`, or `/browse` against `http://localhost:5173`.
   It crashes. Use the smoke test above instead.

2. **The CDP port is dynamically allocated** by default. Set `CDP_PORT=<num>` to pin a specific port.

3. **The Electron window may be slow to load** (Pyodide init takes 30-60s).
   The smoke test waits up to 180s.

4. **Console "errors" from DevTools or HMR** (`Request Autofill.enable failed`,
   Source Map warnings, favicon.ico 404) are benign. The smoke test filters them.

5. **Screenshots capture the visible viewport** (1280×800 default). The smoke test
   saves one; inspect it with `inspect_image`.

## CI workflow

The smoke test runs automatically via `.github/workflows/playtest.yml` on macOS
and Linux (xvfb). Not run on Windows (Electron CDP attach is unreliable there;
renderer unit tests in `test.yml` already cover that platform).