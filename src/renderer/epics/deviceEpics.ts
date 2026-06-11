import { combineEpics, Epic } from 'redux-observable';
import { of, from, timer, ObservableInput, EMPTY } from 'rxjs';
import {
  map,
  pluck,
  mergeMap,
  tap,
  filter,
  catchError,
  takeUntil,
} from 'rxjs/operators';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import { DeviceActions, DeviceActionType, ExperimentActions } from '../actions';
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
  SEARCH_TIMER,
} from '../constants/constants';
import { Device, DeviceInfo } from '../constants/interfaces';
import { RootState } from '../reducers';

// -------------------------------------------------------------------------
// Epics

// NOTE: Uses a Promise "then" inside b/c Observable.from leads to loss of user gesture propagation for web bluetooth
const searchMuseEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
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
        (devices) => devices,
        () => {
          // This error will fire a bit too promiscuously until we fix windows web bluetooth
          // toast.error(`"Device Error: " ${error.toString()}`);
          return [];
        }
      )
    ),
    filter((devices) => !isNil(devices) && devices.length >= 1),
    map(DeviceActions.DeviceFound)
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

const searchTimerEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetDeviceAvailability)),
    pluck('payload'),
    filter((status) => status === DEVICE_AVAILABILITY.SEARCHING),
    // Cancel the timeout as soon as a device is found. Without this, a device
    // discovered right around SEARCH_TIMER races the timer: DeviceFound sets
    // AVAILABLE, then the timer's late NONE clobbers it, leaving a found device
    // the connect modal can't show (it only renders the list when AVAILABLE).
    mergeMap(() =>
      timer(SEARCH_TIMER).pipe(
        takeUntil(action$.pipe(filter(isActionOf(DeviceActions.DeviceFound))))
      )
    ),
    filter(
      () =>
        state$.value.device.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ),
    // Cancel the pending requestDevice() promise in the main process so it
    // doesn't hang after the search window closes.
    tap(() => {
      getDriver(state$.value.device.deviceType).cancelScan();
    }),
    map(() => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );

const connectEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.ConnectToDevice)),
    pluck('payload'),
    map((device) => getDriver(state$.value.device.deviceType).connect(device)),
    mergeMap((promise) => promise.then((deviceInfo) => deviceInfo)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergeMap<DeviceInfo | null, ObservableInput<any>>((deviceInfo) => {
      // returns union of several action types
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

const deviceCleanupEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.ExperimentCleanup)),
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
    mergeMap(() => from(discoverLSLStreams())),
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
  searchMuseEpic,
  deviceFoundEpic,
  searchTimerEpic,
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
