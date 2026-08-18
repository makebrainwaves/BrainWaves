# Device Connectivity

How BrainWaves discovers and connects to EEG devices. Supported devices are Muse
and Neurosity (first-party drivers) plus external LSL inlet streams; the flow
diagrams below trace the **Muse** path specifically, since it is the most involved
(Web Bluetooth device selection). The driver interface itself is device-agnostic —
see the `redux-observable-epochs` skill for the `EEGDriver` contract.

---

## Architecture Overview

Device connectivity spans three layers:

| Layer | Files | Responsibility |
|---|---|---|
| **UI** | `CollectComponent/`, `EEGExplorationComponent` | Trigger search, display state, handle user selection |
| **Epics** | `epics/deviceEpics.ts` | Orchestrate async device lifecycle via RxJS |
| **Driver** | `utils/eeg/index.ts` (registry) → `muse.ts`, `neurosity.ts`. `lslInlet.ts` is a **parallel mode**, not in the registry |

All device state lives in Redux (`reducers/deviceReducer.ts`). Epics react to dispatched actions and fire new actions as side effects.

---

## Connection Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: SEARCH                                                                │
│                                                                                 │
│  CollectComponent mounts (EEG enabled)                                          │
│    │                                                                            │
│    ▼                                                                            │
│  handleStartConnect()                                                           │
│    │  Opens ConnectModal                                                        │
│    │  DeviceActions.SetDeviceAvailability(SEARCHING) ──────────────────────┐   │
│    │                                                                        │   │
│    ▼  (Redux dispatch)                                                      │   │
│                                                                             │   │
│  searchMuseEpic                          searchTimerEpic                   │   │
│    │  filter: SEARCHING                    │  filter: SEARCHING ◄──────────┘   │
│    │  map(getMuse) ──► Promise             │  timer(3000ms)                     │
│    │                        │             │                                    │
│    │                        ▼             │                                    │
│    │        navigator.bluetooth            │                                    │
│    │          .requestDevice()             │  [if still SEARCHING after 3s]    │
│    │         ┌─────────┴──────────┐        │  SetDeviceAvailability(NONE)       │
│    │         │                   │        │                                    │
│    │      rejected            resolved    │                                    │
│    │         │                   │        │                                    │
│    │       return []        return [{id, name}]                                │
│    │         │                   │                                             │
│    │    filtered out        DeviceFound([device])                              │
│    │    (silent)                 │                                             │
│    │                             ▼                                             │
│    │                    deviceFoundEpic                                        │
│    │                       Deduplicates by id                                  │
│    │                       SetAvailableDevices([...])                          │
│    │                       SetDeviceAvailability(AVAILABLE)                    │
└────┼─────────────────────────────────────────────────────────────────────────  │
     │                                                                           │
┌────▼──────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: CONNECT                                                             │
│                                                                               │
│  ConnectModal: user selects device from list, clicks Connect                 │
│    │                                                                          │
│    ▼                                                                          │
│  DeviceActions.ConnectToDevice(device)                                        │
│    │                                                                          │
│    ├──► isConnectingEpic                                                      │
│    │      SetConnectionStatus(CONNECTING)                                     │
│    │                                                                          │
│    └──► connectEpic                                                           │
│             │  reuses BluetoothDevice cached by getMuse()                     │
│             │  deviceInstance.gatt.connect()                                  │
│             │  client.connect(gatt)       [muse-js MuseClient]               │
│             │                                                                 │
│             ├── success ──► DeviceInfo { name, samplingRate: 256, channels } │
│             │                 SetDeviceType(MUSE)                             │
│             │                 SetDeviceInfo(deviceInfo)                       │
│             │                 SetConnectionStatus(CONNECTED)                  │
│             │                                                                 │
│             └── failure ──► SetConnectionStatus(DISCONNECTED)                │
└─────────────────────────────────────────────────────────────────────────────  │
             │                                                                   │
┌────────────▼──────────────────────────────────────────────────────────────── │
│  PHASE 3: DATA STREAM                                                         │
│                                                                               │
│  setRawObservableEpic (triggered by SetDeviceInfo)                           │
│    createRawMuseObservable()                                                  │
│      client.start()                                                           │
│      client.eegReadings ──► zipSamples() ──► filter NaNs ──► share()        │
│    SetRawObservable(observable)                                               │
│                                                                               │
│  setSignalQualityObservableEpic (triggered by SetRawObservable)              │
│    createMuseSignalQualityObservable(rawObservable, connectedDevice)          │
│      addInfo → epoch(64 samples) → bandpassFilter(1–50Hz) → addSignalQuality │
│      → parseMuseSignalQuality() → { channelName: SIGNAL_QUALITY enum }       │
│    SetSignalQualityObservable(observable)                                     │
└─────────────────────────────────────────────────────────────────────────────  │
             │                                                                   │
┌────────────▼────────────────────────────────────────────────────────────────┐ │
│  PHASE 4: CLEANUP (experiment ends or manual disconnect)                    │ │
│                                                                             │ │
│  deviceCleanupEpic (triggered by ExperimentCleanup)                        │ │
│    disconnectFromMuse()   →   client.disconnect()                           │ │
│    DeviceActions.Cleanup()  →  resets deviceReducer to initialState        │ │
└─────────────────────────────────────────────────────────────────────────────┘ │
```

---

## Redux State (`deviceReducer`)

```
deviceType:               DEVICES.MUSE | NEUROSITY | LSL
deviceAvailability:       NONE | SEARCHING | AVAILABLE
connectionStatus:         NOT_YET_CONNECTED | CONNECTING | CONNECTED | DISCONNECTED
availableDevices:         Device[]         — BLE scan results (Muse / Neurosity)
availableLSLStreams:      DiscoveredStream[] — inlet discovery (when liblsl loaded)
connectedDevice:          DeviceInfo | null — { name, samplingRate, channels }
rawObservable:            Observable<EEGData> | null
signalQualityObservable:  Observable<SignalQualityData> | null
```

`DEVICES.GANGLION` exists in the enum only ("One day") and has no driver.

---

## Known Issues

### Fixed: `select-bluetooth-device` handler

Electron 22+ does not show a native Web Bluetooth picker. The renderer
`requestDevice()` hangs unless main handles `select-bluetooth-device`.

**Shipped** in `src/main/index.ts` (~line 676): auto-selects the first advertised
device. The renderer's `requestDevice()` filters already scoped the scan by GATT
UUID (Muse vs Neurosity), so the first hit is the intended headset. A timeout
calls `bluetooth:cancelSearch` (`callback('')`) if nothing appears.

Do not re-add this handler. The file table below used to claim it was missing.

### Fixed: `connectToMuse` second `requestDevice`

`getMuse()` caches the `BluetoothDevice` and `connectToMuse()` reuses it, so
the picker event does not fire twice. Same pattern in `neurosity.ts`.

### Still open: silent search failure

In `searchMuseEpic` (name is historical — it calls `getDriver().scan()`), the
error path returns `[]` and nothing is dispatched. The user leaves "Searching..."
only when `searchTimerEpic` fires. The toast is silenced because Windows Web
Bluetooth rejects promiscuously. Worth revisiting once classroom QA has a
reliable Windows path.

### LSL inlet markers are a no-op (intentional)

LSL inlet is **not** in the `EEGDriver` registry. `injectMarker()` no-ops when
the active connection is an external stream — that recorder owns markers.
First-party Muse/Neurosity still inject locally (CSV + ERP) and, when liblsl
is loaded, `RunComponent` also `sendMarker()`s to the LSL outlet.

---

## Data Flow (during experiment)

```
Muse device (BLE)
    │  raw EEG packets (12-sample frames, 256Hz)
    ▼
muse-js MuseClient
    │  eegReadings: Observable<EEGSample>
    │  eventMarkers: Observable<{ timestamp, value }>
    ▼
createRawMuseObservable()
    │  zipSamples() — assembles 4-channel samples
    │  filter NaNs (Muse 2 artifact)
    │  withLatestFrom(markers) — stamps event markers by timestamp
    ▼
rawObservable  (SetRawObservable → Redux)
    │
    ├──► createMuseSignalQualityObservable()
    │      addInfo (256Hz, 4ch) → epoch(64) → bandpassFilter(1–50Hz)
    │      → addSignalQuality → parseMuseSignalQuality
    │      → SignalQualityData { TP9|AF7|AF8|TP10: GREAT|OK|BAD|DISCONNECTED }
    │      (SetSignalQualityObservable → Redux → ViewerComponent)
    │
    └──► experimentStartEpic (during experiment)
           takeUntil(Stop | Cleanup)
           writeEEGData(streamId, sample) → IPC → main process WriteStream → CSV
```

---

## Files at a Glance

| File | Role |
|---|---|
| `utils/eeg/muse.ts` | Web Bluetooth + muse-js driver |
| `epics/deviceEpics.ts` | Async device lifecycle (search → connect → stream → cleanup) |
| `reducers/deviceReducer.ts` | Device Redux state |
| `actions/deviceActions.ts` | Action creators |
| `components/CollectComponent/ConnectModal.tsx` | Search/connect UI |
| `components/CollectComponent/index.tsx` | Auto-triggers search on mount |
| `components/EEGExplorationComponent.tsx` | Standalone explore-mode connect UI |
| `main/index.ts` | `select-bluetooth-device` auto-pick, `bluetooth:cancelSearch`, LSL IPC, `pyodide://` |
