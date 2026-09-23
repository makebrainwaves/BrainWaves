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
| **UI** | `HeadsetSetup/HeadsetSetupDialog` (opened from Collect, Explore, and the shell device chip) | Trigger search, display state, handle user selection |
| **Epics** | `epics/deviceEpics.ts` | Orchestrate async device lifecycle via RxJS |
| **Driver** | `utils/eeg/index.ts` (registry) → `muse.ts`, `neurosity.ts`. `lslInlet.ts` is a **parallel mode**, not in the registry |

All device state lives in Redux (`reducers/deviceReducer.ts`). Epics react to dispatched actions and fire new actions as side effects.

---

## Connection Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: SEARCH                                                                │
│                                                                                 │
│  HeadsetSetupDialog opens (Collect arrival, Explore button, device chip)        │
│    │  No scan yet — student picks a headset, reads wear/power tips              │
│    ▼                                                                            │
│  "Find my headset" click (user gesture)                                         │
│    │  SetDeviceType(device)                                                     │
│    │  SetDeviceAvailability(SEARCHING) — synchronously, inside the click        │
│    ▼                                                                            │
│  searchEpic                               cancelSearchEpic                      │
│    │  filter: SEARCHING                     │  filter: CancelSearch             │
│    │  map(getDriver().scan()) ──► Promise   │  (× / Escape / Cancel search)     │
│    │                        │               │  driver.cancelScan()              │
│    │                        ▼               │   → bluetooth:cancelSearch        │
│    │        navigator.bluetooth             │  SetDeviceAvailability(NONE)      │
│    │          .requestDevice()  — no timeout; waits for a device,               │
│    │         ┌─────────┴──────────┐   a platform failure, or a cancel          │
│    │      rejected / []        resolved                                         │
│    │         │                   │                                             │
│    │  SetDeviceAvailability   DeviceFound([device])                            │
│    │  (NONE) → "couldn't find"   │   (dropped if no longer SEARCHING)          │
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
│  HeadsetSetupDialog: user selects device from list, clicks Connect           │
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
│             └── failure ──► SetConnectionStatus(DISCONNECTED)  ("Try again") │
│                                                                               │
│  DisconnectFromDevice (Cancel while connecting) abandons the attempt: a late  │
│  success never reports CONNECTED and is disconnected right away.              │
│  LSL inlets follow the same contract (CONNECTING → CONNECTED | DISCONNECTED). │
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
UUID (Muse vs Neurosity), so the first hit is the intended headset. The
renderer's Cancel (`DeviceActions.CancelSearch`) calls `bluetooth:cancelSearch`
(`callback('')`) to reject the pending `requestDevice()`.

Do not re-add this handler. The file table below used to claim it was missing.

### Fixed: `connectToMuse` second `requestDevice`

`getMuse()` caches the `BluetoothDevice` and `connectToMuse()` reuses it, so
the picker event does not fire twice. Same pattern in `neurosity.ts`.

### Fixed: silent search failure

`searchEpic` maps a rejected or empty `scan()` to `SetDeviceAvailability(NONE)`,
so the setup dialog shows "We couldn't find your …" instead of spinning. There is
no search timer: a search ends on a found device, a platform failure, or the
student's Cancel. The error toast stays silenced because Windows Web Bluetooth
rejects promiscuously.

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
| `components/HeadsetSetup/HeadsetSetupDialog.tsx` | Search/connect UI (shell-owned, opened via `HeadsetSetupContext`) |
| `components/HeadsetSetup/pairingStep.ts` | Redux device state + local screen → which setup screen shows |
| `components/CollectComponent/index.tsx` | Opens setup when EEG is on and nothing is connected (never scans) |
| `components/EEGExplorationComponent.tsx` | Explore-mode entry that opens setup |
| `main/index.ts` | `select-bluetooth-device` auto-pick, `bluetooth:cancelSearch`, LSL IPC, `pyodide://` |
