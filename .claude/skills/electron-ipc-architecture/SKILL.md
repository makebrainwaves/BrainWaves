---
name: electron-ipc-architecture
description: Mental model for BrainWaves' Electron process separation and how data crosses the main/preload/renderer boundary. Read this BEFORE touching anything that spans processes — IPC, the preload bridge, native modules (liblsl/koffi), Bluetooth, filesystem writes, or "why can't the renderer just call X". Pair with electron-ipc-channel when actually adding/editing a channel.
---

# Electron IPC architecture (BrainWaves)

Three processes, hard boundary, no shared memory. Everything crosses via IPC.

```
main (Node)              preload (bridge)          renderer (React)
─────────────            ────────────────          ────────────────
ipcMain.handle/on   ◄──  ipcRenderer.invoke/send  ◄── window.electronAPI.*
webContents.send    ──►  ipcRenderer.on(handler)  ──►  onX(callback)
native modules           contextBridge only         no Node, no require
filesystem, dialogs      (contextIsolation: true)   Web Bluetooth lives here
```

## The one rule that explains most bugs

The renderer has **no Node access** (`contextIsolation: true`, `nodeIntegration: false`). It cannot `require`, touch the filesystem, load native modules, or open dialogs. Any such need is a method on `window.electronAPI`, defined in `src/preload/index.ts`. If a renderer file imports `fs`/`path`-for-IO/`electron`, that's the bug — route it through the bridge instead. (`pathe` for pure path string munging is fine; it's not IO.)

## Where each thing lives

- `src/main/index.ts` — all `ipcMain.handle`/`ipcMain.on` registrations, the `BrowserWindow`, native module owners (LSL outlets/inlets), filesystem, dialogs, the EEG write streams (`activeStreams` map), the `pyodide://` protocol handler.
- `src/preload/index.ts` — the **only** file that calls `contextBridge.exposeInMainWorld`. Exposes `electronAPI` plus a couple of synchronous globals injected via `--resource-path`/`process.platform` (renderer module-level code reads `__ELECTRON_RESOURCE_PATH__`/`__ELECTRON_PLATFORM__`). `src/preload/viewer.ts` is the separate preload for the viewer window.
- `src/renderer/types/electron.d.ts` — the `ElectronAPI` TS interface. **Must** mirror the preload object or renderer calls won't type-check. These two files drift; keep them locked.
- `src/shared/lslTypes.ts` — types imported by BOTH main and renderer. The only sanctioned cross-process type sharing.

## Three message directions — pick by shape, not habit

| Need | Pattern | Example |
|------|---------|---------|
| Renderer asks main, wants a result/ack | `ipcRenderer.invoke` ↔ `ipcMain.handle` (Promise) | `lsl:discoverStreams`, every `fs:*` |
| Renderer fires hot/fire-and-forget data at main | `ipcRenderer.send` ↔ `ipcMain.on` (void) | `eeg:writeData`, `lsl:sendEpoch` |
| Main pushes to renderer (events, inlet data) | `mainWindow.webContents.send` → `ipcRenderer.on` | `lsl:inletData`, `lsl:status`, `oauth:callback` |

Hot streaming paths (per-sample EEG, LSL epochs) deliberately use `send`, not `invoke` — a Promise per sample would swamp IPC. See `eeg:writeHeader`/`eeg:writeData` and `lslBridge.ts`'s batching (`batchSamplesToEpoch`, ~125 ms batches).

## Main → renderer subscriptions must return an unsubscribe

Every `onX` in the bridge registers an `ipcRenderer.on` listener and **returns a teardown** that calls `removeListener` (see `onLSLInletData`, `onOAuthCallback`). Renderer code must call it on cleanup or listeners leak across reconnects. Never expose a raw `ipcRenderer.on` without the teardown wrapper.

## Native modules are main-only and load lazily

liblsl (via `node-labstreaminglayer`/koffi) `dlopen`s at require time. It is loaded **lazily and fail-soft** in `src/main/lsl/native.ts` (`loadLSL()` returns module-or-null, memoized). A static `import` would crash the whole app at launch on machines without liblsl. The renderer feature-gates on the `lsl:isAvailable` probe and no-ops LSL calls when unavailable. Do not move native code toward the renderer or make it eager. (See `.llms/learnings.md` → "LSL is optional".)

## When you change anything cross-process

Trace the full chain end to end — a half-wired channel fails silently (renderer call resolves to `undefined`, or `send` lands on no handler with no error). Use `electron-ipc-channel` for the concrete checklist.
