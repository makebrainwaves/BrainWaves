# LSL Integration Plan — BrainWaves

## Executive Summary

This document describes the architecture for adding Lab Streaming Layer (LSL) support to BrainWaves. The design supports connectivity to multiple device types (Muse, Neurosity, and arbitrary third-party LSL devices), real-time EEG visualization, and stimulus marker emission from lab.js experiments — all through a unified data pipeline.

This plan is grounded in the actual codebase (`device-lsl` branch). It supersedes the original research-agent draft, which was written without source access.

---

## Current State (device-lsl branch)

The Muse Web Bluetooth connectivity issues documented in `docs/device-connectivity.md` are **already fixed** on this branch:
- `select-bluetooth-device` handler registered in `src/main/index.ts:459` (auto-selects first Muse)
- `cachedDevice` pattern in `src/renderer/utils/eeg/muse.ts:36` (avoids redundant `requestDevice` call)
- `bluetooth:cancelSearch` IPC implemented in both preload and main

What does NOT yet exist: any LSL plumbing. Everything below is net-new work.

---

## Architecture Overview

```
┌──────────────────────────── Renderer ──────────────────────────────┐
│                                                                     │
│  muse.ts / future neurosity.ts          Redux + RxJS Epics         │
│  ┌───────────────────────────┐        ┌──────────────────────┐     │
│  │ getMuse / connectToMuse   │──raw──►│ deviceEpics.ts       │     │
│  │ createRawMuseObservable() │        │  → rawObservable     │     │
│  └───────────────────────────┘        │  → signalQuality     │     │
│                                       │  → epochBatcher epic │──┐  │
│                                       └──────────────────────┘  │  │
│                                                                  │  │
│  RunComponent.tsx                                                │  │
│  ┌───────────────────────────┐                                   │  │
│  │ injectMuseMarker()   (existing, keep)                         │  │
│  │ window.electronAPI         │                                  │  │
│  │   .sendLSLMarker() (new)  │────────────────────────────────┐ │  │
│  └───────────────────────────┘   ipc: lsl:sendMarker          │ │  │
│                                                                │ │  │
│                                         ipc: lsl:sendEpoch ◄──┘ │  │
│                                                                  │  │
│  ConnectModal / future LSL stream browser                        │  │
│    ipc: lsl:discoverStreams (invoke)                             │  │
│    ipc: lsl:subscribeStream                                      │  │
│    ipc: lsl:unsubscribeStream                                    │  │
│                                                  ipc: lsl:inletData│
│                                                     (main→renderer)│
└──────────────────────────────────────────────────────────────────┴─┘
                                                                   │
┌──────────────────────────── Main Process ──────────────────────── ▼─┐
│                                                                      │
│  src/main/index.ts                                                   │
│    imports LSLOutletManager, LSLInletManager                         │
│                                                                      │
│  src/main/lsl/outlets.ts          src/main/lsl/inlets.ts             │
│  ┌───────────────────────┐       ┌───────────────────────┐           │
│  │ LSLOutletManager      │       │ LSLInletManager        │           │
│  │  per-device EEG outlet│       │  resolveStreams()      │           │
│  │  marker outlet        │       │  create/poll inlets    │           │
│  │  (irregular, string)  │       │  forward via IPC       │           │
│  └───────────────────────┘       └───────────────────────┘           │
│                                                                      │
│              ◄──── LSL network (UDP multicast) ────►                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Decisions and Rationale

### 1. BLE acquisition stays in the renderer via Web Bluetooth

Keep muse-js and @neurosity/sdk in the renderer. Do not migrate to noble/bleat in main.

- Web Bluetooth is actively maintained by Chromium; noble is effectively abandoned
- Electron ships Chromium, so Web Bluetooth works on macOS, Windows, and Linux with no native build deps
- The Neurosity SDK targets Web Bluetooth for its BLE transport; noble is not supported
- IPC overhead with epoch batching (~8–16 messages/sec) is negligible
- Noble requires platform-specific system libraries and `electron-rebuild` for each target

### 2. LSL runs exclusively in the main process

All LSL outlet/inlet operations happen in `src/main/lsl/` using `node-labstreaminglayer`.

- LSL bindings use native liblsl via Node FFI; sandboxed renderers cannot load native modules
- Centralized LSL in main creates a single lifecycle management point
- `node-labstreaminglayer` (EdgeBCI) is the most complete Node binding — supports outlets AND inlets

### 3. Neurosity's built-in device-side LSL is not used

We manage our own outlets for all devices.

- The Crown's embedded LSL is marked experimental with timing variability in their own docs
- Running both device-side and app-side LSL causes duplicate streams in LabRecorder
- Our outlet manager ensures consistent stream metadata and naming across all device types

### 4. Existing muse.ts and epics are modified, not replaced

No new "MuseAdapter class". Instead:
- `src/renderer/utils/eeg/muse.ts` gains an epoch-batching utility function
- A new epic in `deviceEpics.ts` subscribes to `rawObservable` and pipes batched epochs over IPC
- The existing connect/search/signal-quality flow is unchanged

---

## IPC Channels

All channels are registered in `src/preload/index.ts` via `contextBridge.exposeInMainWorld('electronAPI', {...})` and handled in `src/main/index.ts` via `ipcMain.handle` / `ipcMain.on`.

| Channel | Direction | Payload | Rate |
|---|---|---|---|
| `lsl:sendEpoch` | renderer → main | `LSLEpoch` | ~8–16 msg/sec per device |
| `lsl:sendMarker` | renderer → main | `LSLMarker` | Event-driven |
| `lsl:inletData` | main → renderer | `LSLInletEpoch` | ~16–60 msg/sec per stream |
| `lsl:discoverStreams` | renderer → main (invoke) | — | On demand |
| `lsl:subscribeStream` | renderer → main | `{ uid: string }` | Per subscription |
| `lsl:unsubscribeStream` | renderer → main | `{ uid: string }` | Per teardown |
| `lsl:inletDisconnected` | main → renderer | `{ uid: string }` | On loss |
| `lsl:outletStatus` | main → renderer | `{ deviceId, status }` | On outlet change |

---

## Shared Types

Create **`src/shared/lslTypes.ts`** (new file). These types are imported by both `src/main/lsl/` and `src/renderer/`.

To enable this, add a `@shared` alias to **both** the `main` and `renderer` Vite config blocks in `vite.config.ts`:

```ts
// vite.config.ts — add to main.resolve.alias AND renderer.resolve.alias
'@shared': path.resolve(__dirname, 'src/shared'),
```

```typescript
// src/shared/lslTypes.ts

export interface LSLEpoch {
  deviceId: string;
  deviceType: 'muse' | 'neurosity';
  samples: number[][];      // [sampleIndex][channelIndex], µV
  timestamps: number[];     // one per sample (ms, performance.now())
  channelNames: string[];
  sampleRate: number;
}

export interface LSLMarker {
  label: string;            // e.g. 'stimulus_onset', '1', '2'
  rendererTimestamp: number; // performance.now() at event time
}

export interface DiscoveredStream {
  uid: string;
  name: string;
  type: string;             // 'EEG', 'Markers', etc.
  channelCount: number;
  sampleRate: number;
  sourceId: string;
}

export interface LSLInletEpoch {
  uid: string;
  samples: number[][];
  timestamps: number[];
}
```

---

## Constants and Enums

Update **`src/renderer/constants/constants.ts`**:

```ts
export enum DEVICES {
  NONE = 'NONE',
  MUSE = 'MUSE',
  NEUROSITY = 'NEUROSITY',  // add in Phase 2
  LSL = 'LSL',              // add in Phase 3 (external inlet)
  GANGLION = 'GANGLION',
}
```

---

## Component Specifications

### Epoch Batcher (Renderer — `src/renderer/utils/eeg/lslBridge.ts`, new file)

A thin helper module that:
- Exports `batchSamplesToEpoch(rawObservable, deviceId, deviceType, channelNames, sampleRate)` — returns a new Observable that buffers N samples (`bufferCount(32)`) into `LSLEpoch` objects
- Exports `sendEpoch(epoch: LSLEpoch)` — calls `window.electronAPI.sendLSLEpoch(epoch)`
- Exports `sendMarker(marker: LSLMarker)` — calls `window.electronAPI.sendLSLMarker(marker)`

The buffer size of 32 gives ~125ms latency at 256 Hz and ~8 IPC messages/sec — negligible overhead.

### New epic in `deviceEpics.ts`

Add `lslForwardEpic` that:
1. Filters on `DeviceActions.SetRawObservable`
2. Gets device metadata from `state$.value.device.connectedDevice`
3. Pipes `rawObservable` through `batchSamplesToEpoch(...)`
4. Uses `tap(sendEpoch)` to forward each epoch over IPC
5. Completes on `DeviceActions.Cleanup`

This runs alongside — not instead of — the existing `setRawObservableEpic` and `setSignalQualityObservableEpic`.

### Marker Bridge (Renderer — `src/renderer/components/CollectComponent/RunComponent.tsx`)

`RunComponent.tsx` already calls `injectMuseMarker(event, time)` inside a callback. In Phase 4:
- **Keep** the `injectMuseMarker` call (keeps marker-in-raw-EEG behavior for CSV recording)
- **Add** `sendMarker({ label: event, rendererTimestamp: performance.now() })` alongside it
- This makes the marker system device-agnostic — no change required to muse.ts

### LSL Outlet Manager (Main — `src/main/lsl/outlets.ts`, new file)

```ts
import { StreamInfo, StreamOutlet, cf_int32 } from 'node-labstreaminglayer';

class LSLOutletManager {
  private outlets = new Map<string, StreamOutlet>();
  private markerOutlet: StreamOutlet | null = null;

  createDeviceOutlet(deviceId: string, channelNames: string[], sampleRate: number) { ... }
  pushEpoch(deviceId: string, epoch: LSLEpoch) { ... }  // calls outlet.pushChunk()
  destroyDeviceOutlet(deviceId: string) { ... }

  createMarkerOutlet() { ... }  // name='ExperimentMarkers', type='Markers', channels=1, IRREGULAR_RATE, string format
  pushMarker(label: string) { ... }  // calls markerOutlet.pushSample([label])

  destroyAll() { ... }
}

export const lslOutlets = new LSLOutletManager();
```

Imported by `src/main/index.ts`. IPC handlers call `lslOutlets.createDeviceOutlet(...)` on `lsl:outletCreate` and `lslOutlets.pushEpoch(...)` on `lsl:sendEpoch`.

### LSL Inlet Manager (Main — `src/main/lsl/inlets.ts`, new file)

```ts
class LSLInletManager {
  private inlets = new Map<string, { inlet: StreamInlet; timer: NodeJS.Timeout }>();

  async discoverStreams(): Promise<DiscoveredStream[]> { ... }  // resolveStreams(1.0)
  subscribeStream(uid: string, onData: (epoch: LSLInletEpoch) => void) { ... }
  unsubscribeStream(uid: string) { ... }
  destroyAll() { ... }
}
```

The poll loop calls `inlet.pullChunk(timeout=0.0)` at ~60 Hz per subscription and invokes `onData`. `onData` sends `lsl:inletData` via `mainWindow.webContents.send(...)`.

---

## Build Configuration Changes

### `vite.config.ts`

1. Add `@shared` alias to both `main.resolve.alias` and `renderer.resolve.alias`
2. Native modules in main are automatically externalized by electron-vite — no special config needed for `node-labstreaminglayer`

### `package.json` (electron-builder section)

Add `asarUnpack` for native `.node` files — they cannot be loaded from inside an ASAR archive:

```json
"build": {
  "asarUnpack": ["**/*.node"],
  ...
}
```

`node-labstreaminglayer` ships prebuilt liblsl binaries in its `material/liblsl-release/` directory. These get included via the existing `"node_modules/**/*"` entry in `files`. Test packaging early (Phase 1) to confirm binary resolution works.

### `postinstall` / `electron-rebuild`

`electron-builder install-app-deps` (already in `postinstall`) handles rebuilding native modules for Electron's Node ABI. No changes needed to the script.

---

## Pre-existing Bug to Fix in Phase 1

**`src/renderer/epics/experimentEpics.ts:79`** hardcodes `MUSE_CHANNELS`:

```ts
writeHeader(streamId, MUSE_CHANNELS);  // BUG: wrong for Neurosity or LSL inlets
```

Change to:

```ts
writeHeader(streamId, state$.value.device.connectedDevice?.channels ?? MUSE_CHANNELS);
```

---

## Implementation Phases

### Phase 1: Muse → LSL Outlet

**Goal:** Muse EEG data flows through the full pipeline and appears as a stream in LabRecorder.

**Prerequisite:** Muse Web Bluetooth fixes are already merged on `device-lsl`. ✓

**Steps:**

1. **Install `node-labstreaminglayer`**
   ```bash
   npm install node-labstreaminglayer
   npm run postinstall   # runs electron-builder install-app-deps to rebuild native module
   ```
   Verify the package loads in the main process: add a quick `require('node-labstreaminglayer')` test in `src/main/index.ts` and run `npm run dev`.

2. **Add `@shared` alias to `vite.config.ts`** (both `main` and `renderer` blocks).

3. **Create `src/shared/lslTypes.ts`** with `LSLEpoch`, `LSLMarker`, `DiscoveredStream`, `LSLInletEpoch`.

4. **Create `src/main/lsl/outlets.ts`** with `LSLOutletManager`. Wire the `lsl:sendEpoch` IPC handler in `src/main/index.ts`.

5. **Create `src/renderer/utils/eeg/lslBridge.ts`** with `batchSamplesToEpoch` and `sendEpoch`.

6. **Add `lslForwardEpic` to `src/renderer/epics/deviceEpics.ts`**. Register it in `combineEpics` in `src/renderer/epics/index.ts`.

7. **Add LSL IPC methods to `src/preload/index.ts`**:
   ```ts
   sendLSLEpoch: (epoch: LSLEpoch) => ipcRenderer.send('lsl:sendEpoch', epoch),
   sendLSLMarker: (marker: LSLMarker) => ipcRenderer.send('lsl:sendMarker', marker),
   discoverLSLStreams: () => ipcRenderer.invoke('lsl:discoverStreams'),
   ```
   Also add TypeScript declarations for the new methods (the existing `window.electronAPI` object is not yet typed — add a `src/renderer/types/electron.d.ts` declaration file).

8. **Fix the `MUSE_CHANNELS` hardcoding** in `experimentEpics.ts`.

9. **Add `asarUnpack: ["**/*.node"]`** to `package.json` build config.

10. **Test:** connect a Muse, run LabRecorder on the same machine, confirm the EEG stream appears with correct channel count and sample rate.

---

### Phase 2: Neurosity SDK

**Goal:** Neurosity Crown connects and streams to its own LSL outlet alongside Muse.

**Steps:**

1. **Install `@neurosity/sdk`**
   ```bash
   npm install @neurosity/sdk
   ```
   Note: Neurosity SDK uses Web Bluetooth — no native build step needed.

2. **Add `NEUROSITY = 'NEUROSITY'` to `DEVICES` enum** in `constants.ts`.

3. **Create `src/renderer/utils/eeg/neurosity.ts`** mirroring the interface of `muse.ts`:
   - `getNeurosity()` — initiates Web Bluetooth scan for Crown
   - `connectToNeurosity(device)` → returns `DeviceInfo { name, samplingRate: 256, channels: [...] }`
   - `createRawNeurosityObservable()` — wraps `neurosity.brainwaves('raw')`, maps Crown epoch format to the same `EEGData` shape as `createRawMuseObservable()`
   - `disconnectFromNeurosity()`

4. **Update `deviceEpics.ts`** to route based on `deviceType` (Muse vs Neurosity) when calling connect/disconnect/raw observable functions. The existing epic shape stays the same — just add conditionals.

5. **`lslForwardEpic` already handles Neurosity** because it reads `deviceType` from Redux state and passes it through to `LSLEpoch`. The outlet manager creates a separate outlet per `deviceId`.

6. **Test:** simultaneous Muse + Neurosity streams visible in LabRecorder.

---

### Phase 3: LSL Inlet Manager + External Device Visualization

**Goal:** Users can discover and visualize any LSL stream on the local network (OpenBCI, g.tec, BrainFlow, pylsl test scripts), even without a BLE device.

**Steps:**

1. **Create `src/main/lsl/inlets.ts`** with `LSLInletManager` (discover, subscribe, poll, forward).

2. **Wire inlet IPC handlers** in `src/main/index.ts`:
   - `ipcMain.handle('lsl:discoverStreams', ...)` → returns `DiscoveredStream[]`
   - `ipcMain.on('lsl:subscribeStream', ...)` → starts poll loop, sends `lsl:inletData`
   - `ipcMain.on('lsl:unsubscribeStream', ...)` → stops poll loop

3. **Add inlet IPC to preload** (`subscribeLSLStream`, `unsubscribeLSLStream`, `onLSLInletData`).

4. **Build a stream discovery UI** — add a new tab or section in `ConnectModal.tsx` for "External LSL Device". It calls `discoverLSLStreams()`, shows results, and lets the user subscribe.

5. **Add `LSL = 'LSL'` to `DEVICES` enum** and add a new Redux action `SetLSLInletStream` that stores the `DiscoveredStream` info in `deviceReducer` as the `connectedDevice`.

6. **Wire inlet data to `rawObservable`** — when an inlet is subscribed, create an RxJS Subject in the renderer that emits `EEGData` for each `lsl:inletData` message, then dispatch `SetRawObservable` with it. Signal quality viz will work automatically.

7. **Test with BrainFlow or `pylsl`** test sender script.

---

### Phase 4: Stimulus Markers via LSL

**Goal:** lab.js experiment events appear as a dedicated Markers stream in LabRecorder, aligned with the EEG stream.

**Steps:**

1. **Create the marker outlet** in `LSLOutletManager`:
   - `StreamInfo`: name `'BrainWavesMarkers'`, type `'Markers'`, 1 channel, `IRREGULAR_RATE`, format `string`
   - Create on app startup (not per-device)

2. **Wire `lsl:sendMarker` IPC handler** in `src/main/index.ts` → calls `lslOutlets.pushMarker(label)`.

3. **Update `RunComponent.tsx`** to call `window.electronAPI.sendLSLMarker({ label: event, rendererTimestamp: performance.now() })` alongside the existing `injectMuseMarker(event, time)` call.
   - Keep `injectMuseMarker` — it embeds markers in the raw EEG CSV, which the existing Pyodide analysis pipeline depends on.

4. **Implement clock sync** (optional, needed if sub-5ms precision required):
   - Periodically send a round-trip IPC ping: renderer records `t0 = performance.now()`, main records `lsl_local_clock()`, renderer records `t1`. Offset ≈ `lsl_local_clock() - (t0 + t1) / 2`.
   - Store offset in a ref; pass it in `LSLMarker` so main can correct the LSL timestamp.
   - For most ERP paradigms, raw IPC jitter (1–5ms) is acceptable and this step can be deferred.

5. **Test:** run Stroop or N170 experiment with LabRecorder, load XDF in MNE Python, verify marker latencies align with EEG epochs.

---

### Phase 5: Production Hardening

- **Backpressure for high-density inlets**: for 64+ channel streams at 1kHz+, decimate in main before forwarding to renderer. Full-rate stays on LSL network for LabRecorder.
- **Graceful error handling**: BLE disconnects, LSL network loss, inlet timeouts, `node-labstreaminglayer` FFI errors.
- **Platform testing**: macOS arm64, macOS x64, Windows x64. Confirm liblsl binary path resolves correctly post-packaging.
- **Electron packaging verification**: `npm run package`, install the `.dmg`/`.exe`, run with LabRecorder.
- **Linux Web Bluetooth**: `--enable-experimental-web-platform-features` is already set in `src/main/index.ts:23`. Verify BLE works end-to-end on Ubuntu.

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| `node-labstreaminglayer` is low-traffic (~7 downloads/week) with possible undiscovered Electron-specific bugs | Medium | Pin version. Test Phase 1 against real hardware before building further. If FFI proves unstable, fallback: Python sidecar process using `pylsl` with a WebSocket bridge. |
| liblsl binary path breaks after electron-builder packaging (ASAR) | High | Add `asarUnpack: ["**/*.node"]` in Phase 1. Test packaged build early — don't leave this for Phase 5. |
| IPC marker jitter exceeds tolerance for ERP analysis | Low | Document typical jitter (1–5ms). Add clock sync in Phase 4 if needed. |
| `@neurosity/sdk` Web Bluetooth API changes or breaks | Medium | SDK is MIT; fork if needed. Crown BLE protocol is documented. |
| High-channel-count LSL inlets (64ch, 1kHz) overwhelm renderer | Medium | Decimate in main process in Phase 5. |
| iOS / mobile pivot requires native BLE | Low (deferred) | Adapter pattern in `muse.ts` / `neurosity.ts` isolates BLE. Add native adapter without touching LSL/viz/marker code. |

---

## File Inventory

### New files to create

| File | Purpose |
|---|---|
| `src/shared/lslTypes.ts` | Shared IPC payload types |
| `src/main/lsl/outlets.ts` | `LSLOutletManager` class |
| `src/main/lsl/inlets.ts` | `LSLInletManager` class (Phase 3) |
| `src/renderer/utils/eeg/lslBridge.ts` | Epoch batcher + IPC send helpers |
| `src/renderer/utils/eeg/neurosity.ts` | Neurosity device driver (Phase 2) |
| `src/renderer/types/electron.d.ts` | TypeScript declarations for `window.electronAPI` |

### Files to modify

| File | Change |
|---|---|
| `vite.config.ts` | Add `@shared` alias to `main` and `renderer` blocks |
| `package.json` | Add `asarUnpack: ["**/*.node"]` to build config |
| `src/preload/index.ts` | Add LSL IPC methods (`sendLSLEpoch`, `sendLSLMarker`, `discoverLSLStreams`, etc.) |
| `src/main/index.ts` | Import and initialize `LSLOutletManager`; register IPC handlers |
| `src/renderer/constants/constants.ts` | Add `NEUROSITY` and `LSL` to `DEVICES` enum |
| `src/renderer/epics/deviceEpics.ts` | Add `lslForwardEpic`; route Neurosity in Phase 2 |
| `src/renderer/epics/index.ts` | Register `lslForwardEpic` in `combineEpics` |
| `src/renderer/epics/experimentEpics.ts` | Fix `MUSE_CHANNELS` hardcoding (line 79) |
| `src/renderer/components/CollectComponent/RunComponent.tsx` | Add `sendLSLMarker` call alongside `injectMuseMarker` (Phase 4) |
