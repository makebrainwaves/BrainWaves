import { combineEpics, Epic } from 'redux-observable';
import { of, from, ObservableInput, EMPTY } from 'rxjs';
import {
  map,
  pluck,
  mergeMap,
  tap,
  filter,
  catchError,
  takeUntil,
} from 'rxjs/operators';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import { DeviceActions, DeviceActionType } from '../actions';
import { getDriver, setActiveDriver } from '../utils/eeg';
import { createMuseSignalQualityObservable } from '../utils/eeg/muse';
import {
  discoverLSLStreams,
  connectToLSLInlet,
  createRawLSLInletObservable,
  disconnectFromLSLInlet,
} from '../utils/eeg/lslInlet';
import { batchSamplesToEpoch, sendEpoch } from '../utils/eeg/lslBridge';
import {
  CONNECTION_STATUS,
  DEVICES,
  DEVICE_AVAILABILITY,
} from '../constants/constants';
import { Device, DeviceInfo } from '../constants/interfaces';
import { RootState } from '../reducers';

// -------------------------------------------------------------------------
// Epics

/**
 * Runs one discovery per SEARCHING. `scan()` is called synchronously inside the
 * dispatch so Web Bluetooth keeps the user gesture (Observable.from loses it).
 * The search stays open until the driver answers; a rejected or empty scan
 * ends it as not found. Results after a cancel are dropped.
 */
const searchEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetDeviceAvailability)),
    pluck('payload'),
    filter((status) => status === DEVICE_AVAILABILITY.SEARCHING),
    map(() => getDriver(state$.value.device.deviceType).scan()),
    mergeMap((promise) =>
      promise.then(
        (devices) =>
          devices?.length
            ? DeviceActions.DeviceFound(devices)
            : DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
        () => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE)
      )
    ),
    filter(
      () =>
        state$.value.device.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    )
  );

const deviceFoundEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.DeviceFound)),
    pluck('payload'),
    map((foundDevices) =>
      foundDevices.reduce((acc, curr) => {
        if (acc.find((device) => device.id === curr.id)) {
          return acc;
        }
        return acc.concat(curr);
      }, state$.value.device.availableDevices)
    ),
    mergeMap((devices) =>
      of(
        DeviceActions.SetAvailableDevices(devices),
        DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.AVAILABLE)
      )
    )
  );

/** User cancelled: reject the pending requestDevice() in main and end the search. */
const cancelSearchEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.CancelSearch)),
    tap(() => getDriver(state$.value.device.deviceType).cancelScan()),
    map(() => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );

/**
 * Connects the chosen device. A rejected connect reports DISCONNECTED (the
 * setup flow's "failed" state) without killing the epic; DisconnectFromDevice
 * abandons an in-flight attempt so a late success cannot report CONNECTED.
 */
const connectEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.ConnectToDevice)),
    pluck('payload'),
    mergeMap((device) =>
      from(getDriver(state$.value.device.deviceType).connect(device)).pipe(
        catchError(() => of(null)),
        takeUntil(
          action$.pipe(filter(isActionOf(DeviceActions.DisconnectFromDevice)))
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mergeMap<DeviceInfo | null, ObservableInput<any>>((deviceInfo) => {
          if (deviceInfo != null && deviceInfo.samplingRate != null) {
            // Mark this device's driver active so the marker dispatcher and the
            // raw-observable epic resolve to the right backend.
            setActiveDriver(state$.value.device.deviceType);
            // Preserve the currently-selected deviceType; do not hardcode MUSE.
            return of(
              DeviceActions.SetDeviceType(state$.value.device.deviceType),
              DeviceActions.SetDeviceInfo(deviceInfo),
              DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
            );
          }
          return of(
            DeviceActions.SetConnectionStatus(CONNECTION_STATUS.DISCONNECTED)
          );
        })
      )
    )
  );

const isConnectingEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.ConnectToDevice)),
    map(() => DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTING))
  );

// TODO: confirm the shape of data that actually flows through these observables  and formalize with interfaces
const setRawObservableEpic: Epic<
  DeviceActionType,
  DeviceActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetDeviceInfo)),
    // LSL inlets supply their own raw observable via connectToLSLStreamEpic —
    // they must not fall through to the BLE drivers here, or connecting an LSL
    // stream would erroneously start the Muse client and clobber the inlet's
    // observable with a second SetRawObservable.
    filter(() => state$.value.device.deviceType !== DEVICES.LSL),
    mergeMap(() =>
      from(getDriver(state$.value.device.deviceType).createRawObservable())
    ),
    map(DeviceActions.SetRawObservable)
  );

const setSignalQualityObservableEpic: Epic<
  DeviceActionType,
  DeviceActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetRawObservable)),
    pluck('payload'),
    map((rawObservable) =>
      createMuseSignalQualityObservable(
        rawObservable,
        state$.value.device.connectedDevice
      )
    ),
    map(DeviceActions.SetSignalQualityObservable)
  );

/**
 * Tears down the driver and resets device state, but only on an explicit
 * disconnect request. Experiment cleanup (e.g. navigating Home) must NOT
 * reach here — the connection stays alive so Explore → Home → Collect can
 * reuse it (plan §2.2).
 */
const deviceCleanupEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.DisconnectFromDevice)),
    filter(
      () =>
        state$.value.device.connectionStatus !==
        CONNECTION_STATUS.NOT_YET_CONNECTED
    ),
    map(() => {
      const dt = state$.value.device.deviceType;
      if (dt === DEVICES.LSL) {
        disconnectFromLSLInlet();
      } else {
        void getDriver(dt).disconnect();
      }
      setActiveDriver(null);
    }),
    map(DeviceActions.Cleanup)
  );

// Watches for unexpected BLE disconnects and dispatches DeviceLost so the UI
// can clear its "connected" state and surface a toast. Only runs while a BLE
// device is active — LSL inlets have their own disconnect path.
const deviceDisconnectWatchEpic: Epic<
  DeviceActionType,
  DeviceActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetConnectionStatus)),
    pluck('payload'),
    filter((status) => status === CONNECTION_STATUS.CONNECTED),
    mergeMap(() => {
      const dt = state$.value.device.deviceType;
      // LSL inlets have their own disconnect path; only BLE drivers report here.
      if (dt === DEVICES.LSL) return EMPTY;
      return getDriver(dt).disconnect$();
    }),
    tap(() => toast.error('EEG device disconnected')),
    map(() => DeviceActions.DeviceLost()),
    takeUntil(action$.pipe(filter(isActionOf(DeviceActions.Cleanup))))
  );

// Responds to DeviceLost by tearing down driver state and resetting redux.
const deviceLostCleanupEpic: Epic<
  DeviceActionType,
  DeviceActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.DeviceLost)),
    tap(() => {
      const dt = state$.value.device.deviceType;
      if (dt !== DEVICES.LSL) void getDriver(dt).disconnect();
      setActiveDriver(null);
    }),
    map(DeviceActions.Cleanup)
  );

// External LSL inlet — discovery and connection have a separate flow from
// BLE (no requestDevice gesture), so they get their own epics.
const discoverLSLStreamsEpic: Epic<
  DeviceActionType,
  DeviceActionType,
  RootState
> = (action$) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.DiscoverLSLStreams)),
    mergeMap(() => from(discoverLSLStreams()).pipe(catchError(() => of([])))),
    map(DeviceActions.SetAvailableLSLStreams)
  );

const connectToLSLStreamEpic: Epic<
  DeviceActionType,
  DeviceActionType,
  RootState
> = (action$) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.ConnectToLSLStream)),
    pluck('payload'),
    mergeMap((stream) => {
      const deviceInfo = connectToLSLInlet(stream);
      // LSL recording is an external-recorder mode — no first-party driver owns
      // markers, so clear any previously-active BLE driver (injectMarker no-ops).
      setActiveDriver(null);
      return from(createRawLSLInletObservable(stream)).pipe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mergeMap<unknown, ObservableInput<any>>((rawObservable) =>
          of(
            DeviceActions.SetDeviceType(DEVICES.LSL),
            DeviceActions.SetDeviceInfo(deviceInfo),
            DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED),
            DeviceActions.SetRawObservable(rawObservable)
          )
        )
      );
    })
  );

// Forwards each raw EEG sample over IPC to the main-process LSL outlet.
// Runs in parallel with setSignalQualityObservableEpic — does not modify
// the observable that feeds the signal-quality / viewer pipelines.
const lslForwardEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetRawObservable)),
    pluck('payload'),
    mergeMap((rawObservable) => {
      const device = state$.value.device.connectedDevice;
      const deviceType = state$.value.device.deviceType;
      if (!device || !rawObservable) return EMPTY;
      // Skip the outlet for LSL inlet sources — re-broadcasting a stream we
      // just received from LSL would create a feedback loop in LabRecorder.
      if (deviceType === DEVICES.LSL) return EMPTY;
      // Fixture is a synthetic replay source — no real LSL outlet needed.
      if (deviceType === DEVICES.FIXTURE) return EMPTY;
      const lslDeviceType: 'muse' | 'neurosity' =
        deviceType === DEVICES.MUSE ? 'muse' : 'neurosity';
      return batchSamplesToEpoch(
        rawObservable,
        device.name || lslDeviceType,
        lslDeviceType,
        device.channels,
        device.samplingRate
      ).pipe(
        tap(sendEpoch),
        takeUntil(action$.pipe(filter(isActionOf(DeviceActions.Cleanup))))
      );
    }),
    // This epic is a side-effect sink — emit nothing back into the action stream.
    mergeMap(() => EMPTY)
  );

export default combineEpics(
  searchEpic,
  deviceFoundEpic,
  cancelSearchEpic,
  connectEpic,
  isConnectingEpic,
  setRawObservableEpic,
  setSignalQualityObservableEpic,
  lslForwardEpic,
  discoverLSLStreamsEpic,
  connectToLSLStreamEpic,
  deviceCleanupEpic,
  deviceDisconnectWatchEpic,
  deviceLostCleanupEpic
);
