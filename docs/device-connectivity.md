# Device Connectivity

How BrainWaves discovers and connects to EEG devices (currently: Muse only).

---

## Architecture Overview

Device connectivity spans three layers:

| Layer | Files | Responsibility |
|---|---|---|
| **UI** | `CollectComponent/`, `EEGExplorationComponent` | Trigger search, display state, handle user selection |
| **Epics** | `epics/deviceEpics.ts` | Orchestrate async device lifecycle via RxJS |
| **Driver** | `utils/eeg/muse.ts` | Web Bluetooth API calls via `muse-js` |

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
│           connectToMuse(device)                                               │
│             │  navigator.bluetooth.requestDevice() [again, with name filter] │
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
deviceType:               DEVICES.MUSE (only supported device)
deviceAvailability:       NONE | SEARCHING | AVAILABLE
connectionStatus:         NOT_YET_CONNECTED | CONNECTING | CONNECTED | DISCONNECTED
availableDevices:         Device[]         — list from getMuse()
connectedDevice:          DeviceInfo | null — { name, samplingRate, channels }
rawObservable:            Observable<EEGData> | null
signalQualityObservable:  Observable<SignalQualityData> | null
```

---

## Known Issues & Bug Analysis

### Bug: No devices found despite nearby Muse

**Symptom:** `SetDeviceAvailability(SEARCHING)` fires, 3-second timer elapses, state returns to NONE. No devices listed, no error shown.

**Root cause: Missing `select-bluetooth-device` handler in Electron main process.**

Electron 22+ changed how Web Bluetooth works. When `navigator.bluetooth.requestDevice()` is called in the renderer, Electron fires a `select-bluetooth-device` event on `webContents` instead of showing the browser's built-in Bluetooth picker. If no handler is registered in the main process, the Promise **hangs indefinitely** (or rejects silently in some Electron versions), and the epic's error handler catches it and returns `[]`.

**The app is running Electron 39 — this handler is mandatory.**

The fix requires registering a handler in `src/main/index.ts` before the window is created:

```ts
mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
  event.preventDefault();
  // Store callback and deviceList in state, send to renderer via IPC
  // so the user can pick from the ConnectModal UI.
  // OR: auto-select first matching Muse device:
  const muse = deviceList.find(d => d.deviceName.startsWith('Muse'));
  if (muse) {
    callback(muse.deviceId);
  } else {
    callback(''); // reject — no Muse found
  }
});
```

There are two approaches for the UX:

- **Auto-select** (simpler): in the handler, filter `deviceList` for any device whose name starts with `'Muse'` and immediately call `callback(deviceId)`. The user never sees a picker — it just connects.
- **Show picker in app UI** (better): send the `deviceList` to the renderer via IPC, display them in `ConnectModal`, and invoke the callback with the user's selection. Requires storing the callback reference in main process state between IPC calls.

### Bug: `connectToMuse` calls `requestDevice` a second time

`getMuse()` calls `requestDevice()` to scan, returns `[{ id, name }]`. Then when the user clicks Connect, `connectToMuse()` calls `requestDevice()` **again** with a name filter. This means the Bluetooth picker (or `select-bluetooth-device` event) fires twice for a single connection. Once the `select-bluetooth-device` handler is in place, both calls need to be handled.

The cleaner fix is to cache the `BluetoothDevice` instance returned by the first `requestDevice()` call inside `getMuse()` and reuse it in `connectToMuse()`, skipping the second scan entirely.

### Bug: Silent failure, no user feedback on search errors

In `searchMuseEpic`, the error handler returns `[]` and the filter `devices.length >= 1` blocks it from dispatching anything. The user only escapes the "Searching..." state when the 3-second `searchTimerEpic` fires. There is no error message, no indication of what went wrong.

The comment in the code acknowledges this: `"This error will fire a bit too promiscuously until we fix windows web bluetooth"` — the toast was intentionally silenced. Once the `select-bluetooth-device` handler is in place, errors will be more meaningful and the toast can be re-enabled.

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
| `main/index.ts` | **Missing: `select-bluetooth-device` handler** |
