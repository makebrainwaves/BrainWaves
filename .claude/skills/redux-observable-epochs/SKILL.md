---
name: redux-observable-epochs
description: How EEG epochs and markers flow through BrainWaves' redux-observable (RxJS epic) pipeline — from live device samples, through marker injection, to MNE epoching for ERPs. Use when adding/debugging an epic, touching the raw/signal observables, marker injection, the marker registry, or "why are my epochs empty / markers all zero / ERP has no events". Explains the epic anatomy and the numeric-code contract that links collection to analysis.
---

# Epochs & markers via redux-observable

Two distinct "epoch" worlds, joined by **numeric marker codes**:
1. **Live epochs** — RxJS observables of raw EEG samples from a device, recorded to CSV and optionally forwarded to LSL.
2. **Analysis epochs** — MNE `Epochs` built by slicing the recorded raw around marker events for ERP/topo/PSD.

Get the codes wrong and the data looks fine but ERPs are empty. That contract is the heart of this skill.

## Epic anatomy (the pattern to copy)

Side effects live in epics (`redux-observable`), never in reducers/components. Standard shape (see `src/renderer/epics/`):

```ts
const fooEpic: Epic<ActionType, ActionType, RootState> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(SomeActions.Trigger)),  // gate on a typed action
    pluck('payload'),                          // or map to read payload
    mergeMap(/* async side effect */),         // do the work
    map(SomeActions.Done)                       // dispatch result action(s)
  );
```

Rules:
- Gate with `filter(isActionOf(...))` (`../utils/redux`), not string compares.
- Read current state via `state$.value.*` (e.g. `state$.value.pyodide.worker!`).
- An epic **must** return an action stream. Fire-and-forget (plots, worker pushes): `tap(() => effect())` then `mergeMap(() => EMPTY)` — emit nothing rather than leak a value.
- Register the epic in the file's `combineEpics(...)` and the file in `epics/index.ts`. An unregistered epic silently never runs.
- Long-lived subscriptions (device `disconnect$`, worker `message`/`error` via `fromEvent`) are created inside an epic and live for the app session — see `pyodideMessageEpic`/`pyodideErrorEpic`.

## Live epoch flow (device → recording → LSL)

`deviceEpics.ts` resolves the active backend via `getDriver(deviceType)` (never branches on MUSE/NEUROSITY). Key epics:
- `setRawObservableEpic` — `from(getDriver(dt).createRawObservable())` produces the per-sample EEG stream stored in state.
- Recording writes samples to CSV via the `eeg:writeData` IPC (main holds the write stream).
- `lslForwardEpic` + `lslBridge.batchSamplesToEpoch` — batch ~32 samples and forward to the main-process LSL outlet (only when `isLSLAvailable()`).

Markers are injected device-agnostically: the UI calls `injectMarker()`, which delegates to the active driver's `injectMarker` (set on connect via `setActiveDriver`). Every driver implements the `EEGDriver` interface (`utils/eeg/types.ts`) — a device can't ship without a marker path. (LSL inlet is intentionally out of the driver registry; its `injectMarker` no-ops.)

## The marker-code contract (read this before debugging empty ERPs)

Markers in the CSV `Marker` column are **numeric** EVENTS codes (`stimulus.type`, e.g. `STIMULUS_1 = 1`), 1-based — **not** strings, not array indices. MNE's `find_events` reads them off the last (`stim`) channel.

`buildMarkerRegistry(stimuli)` (`utils/eeg/markerRegistry.ts`) is the **single source of truth**, used by BOTH:
- collection — the CSV codes + the `-events.json` sidecar (`eeg:writeEvents` IPC), and
- analysis — the MNE `event_id` map.

In `pyodideEpics.loadEpochsEpic`, `event_id` is derived from `buildMarkerRegistry(...).eventId`, NOT from `{title: arrayIndex}`. The classic bug: a 0-based index map didn't match the 1-based codes in the data, so code-2 epochs matched no `event_id` and MNE raised "No matching events". If you add/reorder stimuli or a new device, route everything through `buildMarkerRegistry` — don't hand-build code maps anywhere.

## Analysis epoch flow (pyodideEpics)

`LoadEpochs` → read CSVs → `loadCSV` → `filterIIR(1, 30)` → build `event_id` from the registry → `epochEvents(worker, eventId, tmin, tmax)` (wraps `get_raw_epochs` in `utils.py`) → `GetEpochsInfo`. Plotting/cleaning epics consume `raw_epochs`/`clean_epochs`. The actual MNE work happens in the Pyodide worker — see the `pyodide-mne` skill for the worker protocol.

## Debugging checklist

- **Markers all zero in CSV** → the device's `injectMarker` isn't wired, or `setActiveDriver` didn't run on connect.
- **"No matching events" / empty ERP** → `event_id` not derived from `buildMarkerRegistry`; codes (1-based) vs map mismatch.
- **Epic never fires** → not in `combineEpics` / `epics/index.ts`, or the `filter(isActionOf(...))` targets the wrong action.
- **Value leaks downstream** from a side-effect epic → use `mergeMap(() => EMPTY)`, not `map`.
