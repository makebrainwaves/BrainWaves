---
name: electron-ipc-channel
description: Step-by-step procedure for adding, editing, or removing an Electron IPC channel in BrainWaves without leaving it half-wired. Use whenever the renderer needs something only the main process can do (filesystem, dialogs, native/LSL, Bluetooth) or main needs to push events to the renderer. Covers the four files that must stay in sync and how to pick invoke vs send vs webContents.send. Read electron-ipc-architecture first for the mental model.
---

# Adding / editing an IPC channel (BrainWaves)

A channel is correct only when **all four touch-points agree**. Skip one and it fails silently.

## 1. Pick the direction and primitive

- **Renderer needs a value or an ack from main** → `invoke` ↔ `handle` (returns a Promise). Default choice for anything request/response: all `fs:*`, `dialog:*`, `lsl:discoverStreams`, `lsl:isAvailable`.
- **Renderer fires hot, high-frequency data and doesn't need a reply** → `send` ↔ `on` (void). Only for streaming paths: `eeg:writeData`, `lsl:sendEpoch`, `lsl:sendMarker`. Don't use `send` just to avoid `async` — you lose error propagation and ordering guarantees.
- **Main pushes events to the renderer** (inlet data, status, OAuth) → `webContents.send` → bridge `onX(callback)` wrapper.

Channel naming: `namespace:verb` (e.g. `fs:readFiles`, `lsl:sendEpoch`). Match the existing groups in `src/main/index.ts`.

## 2. The four files (keep locked)

### a. `src/main/index.ts` — register the handler
```ts
// request/response
ipcMain.handle('fs:doThing', (_event, arg: string) => doThing(arg));
// fire-and-forget
ipcMain.on('eeg:writeData', (_event, streamId, data) => { /* ... */ });
```
Wrap native/LSL handlers in try/catch and surface failures via `emitLSLStatus(...)` (don't throw across IPC for the hot paths). For main→renderer pushes, send on `mainWindow?.webContents.send('lsl:status', payload)`.

### b. `src/preload/index.ts` — expose it on `electronAPI`
```ts
doThing: (arg: string): Promise<Result> => ipcRenderer.invoke('fs:doThing', arg),
// fire-and-forget returns void:
writeEEGData: (streamId: string, data: unknown): void =>
  ipcRenderer.send('eeg:writeData', streamId, data),
```
For a main→renderer push, expose a subscription that **registers a listener and returns a teardown** — copy the shape of `onLSLInletData`:
```ts
onThing: (handler: (p: Payload) => void): (() => void) => {
  const listener = (_e: unknown, p: Payload) => handler(p);
  ipcRenderer.on('ns:thing', listener);
  return () => ipcRenderer.removeListener('ns:thing', listener);
},
```

### c. `src/renderer/types/electron.d.ts` — add the matching signature
The `ElectronAPI` interface must mirror b exactly. This is the file most often forgotten — without it the renderer call is `any`/untyped or a type error. `invoke` → `Promise<T>`; `send` → `void`; subscription → `(handler) => () => void`.

### d. Renderer caller — use it
Call `window.electronAPI.doThing(...)`. Shared payload types go in `src/shared/lslTypes.ts` (or a sibling shared file) so main and renderer import the same type. For subscriptions, store the returned teardown and call it on unmount/cleanup (or in the epic's teardown) — see how `lslBridge.ts` / device epics consume `onLSLInletData`.

## 3. Verify the whole chain

- `npm run typecheck` — catches preload↔`electron.d.ts` drift.
- Confirm the channel string is **byte-identical** in all three of: `handle`/`on`, `ipcRenderer.*`, and any `webContents.send`. A typo here is the classic silent failure (call resolves `undefined`, or `send` hits no handler with no error).
- Hot path? Confirm it's batched/throttled, not per-sample `invoke` (see `lslBridge.ts` batching, `lsl:status` 5s throttle).
- Native/LSL? Confirm the renderer side feature-gates on `isLSLAvailable()` and no-ops when false, and that the handler tolerates `loadLSL()` returning null.

## 4. Removing a channel

Delete from all four files. Grep the channel string repo-wide before declaring it gone — leftover `ipcRenderer.on` listeners leak; leftover `electron.d.ts` entries lie about the API.
