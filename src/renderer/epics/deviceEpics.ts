import { combineEpics, Epic } from 'redux-observable';
import { of, from, timer, ObservableInput } from 'rxjs';
import { map, pluck, mergeMap, tap, filter, catchError } from 'rxjs/operators';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import { DeviceActions, DeviceActionType, ExperimentActions } from '../actions';
import {
  getMuse,
  connectToMuse,
  createRawMuseObservable,
  createMuseSignalQualityObservable,
  disconnectFromMuse,
  cancelMuseScan,
} from '../utils/eeg/muse';
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
  action$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetDeviceAvailability)),
    pluck('payload'),
    filter((status) => status === DEVICE_AVAILABILITY.SEARCHING),
    map(getMuse),
    mergeMap((promise) =>
      promise.then(
        (devices) => devices,
        (error) => {
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
    mergeMap(() => timer(SEARCH_TIMER)),
    filter(
      () =>
        state$.value.device.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ),
    // Cancel the pending requestDevice() promise in the main process so it
    // doesn't hang after the search window closes.
    tap(() => cancelMuseScan()),
    map(() => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );

const connectEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.ConnectToDevice)),
    pluck('payload'),
    map((device) => connectToMuse(device) as Promise<DeviceInfo | null>),
    mergeMap((promise) => promise.then((deviceInfo) => deviceInfo)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergeMap<DeviceInfo | null, ObservableInput<any>>((deviceInfo) => {
      // returns union of several action types
      if (deviceInfo != null && deviceInfo.samplingRate != null) {
        console.log(deviceInfo);
        return of(
          DeviceActions.SetDeviceType(DEVICES.MUSE),
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
    mergeMap(() => from(createRawMuseObservable())),
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
      disconnectFromMuse();
    }),
    map(DeviceActions.Cleanup)
  );

export default combineEpics(
  searchMuseEpic,
  deviceFoundEpic,
  searchTimerEpic,
  connectEpic,
  isConnectingEpic,
  setRawObservableEpic,
  setSignalQualityObservableEpic,
  deviceCleanupEpic
);
