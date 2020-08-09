import { combineEpics, Epic } from 'redux-observable';
import { of, from, timer, ObservableInput } from 'rxjs';
import { map, pluck, mergeMap, tap, filter, catchError } from 'rxjs/operators';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import { isActionOf } from 'typesafe-actions';
import { DeviceActions, DeviceActionType, ExperimentActions } from '../actions';
import {
  getEmotiv,
  connectToEmotiv,
  createRawEmotivObservable,
  createEmotivSignalQualityObservable,
  disconnectFromEmotiv,
} from '../utils/eeg/emotiv';
import {
  getMuse,
  connectToMuse,
  createRawMuseObservable,
  createMuseSignalQualityObservable,
  disconnectFromMuse,
} from '../utils/eeg/muse';
import {
  CONNECTION_STATUS,
  DEVICES,
  DEVICE_AVAILABILITY,
  SEARCH_TIMER,
} from '../constants/constants';
import { Device, DeviceInfo } from '../constants/interfaces';
import { DeviceStateType } from '../reducers/deviceReducer';
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

const searchEmotivEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetDeviceAvailability)),
    pluck('payload'),
    filter((status) => status === DEVICE_AVAILABILITY.SEARCHING),
    filter(() => process.platform === 'darwin' || process.platform === 'win32'),
    map(getEmotiv),
    mergeMap((promise) =>
      promise.then(
        (devices) => devices,
        (error) => {
          if (error.message.includes('client.queryHeadsets')) {
            toast.error(
              'Could not connect to Cortex Service. Please connect to the internet and install Cortex to use Emotiv EEG',
              { autoClose: 7000 }
            );
          } else {
            toast.error(`"Device Error: " ${error.toString()}`);
          }
          console.error('searchEpic: ', error.toString());
          return [];
        }
      )
    ),
    filter((devices) => devices.length >= 1),
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
    map(() => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );

const connectEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.ConnectToDevice)),
    pluck('payload'),
    map<Device, Promise<any>>((device) =>
      isNil(device.name) ? connectToEmotiv(device) : connectToMuse(device)
    ),
    mergeMap<Promise<any>, ObservableInput<DeviceInfo>>((promise) =>
      promise.then((deviceInfo) => deviceInfo)
    ),
    mergeMap<DeviceInfo, ObservableInput<any>>((deviceInfo) => {
      if (!isNil(deviceInfo) && !isNil(deviceInfo.samplingRate)) {
        return of(
          DeviceActions.SetDeviceType(
            deviceInfo.name.includes('Muse') ? DEVICES.MUSE : DEVICES.EMOTIV
          ),
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

const setRawObservableEpic: Epic<
  DeviceActionType,
  DeviceActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetDeviceInfo)),
    mergeMap(() => {
      if (state$.value.device.deviceType === DEVICES.EMOTIV) {
        return from(createRawEmotivObservable());
      }
      return from(createRawMuseObservable());
    }),
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
    map((rawObservable) => {
      if (state$.value.device.deviceType === DEVICES.EMOTIV) {
        return createEmotivSignalQualityObservable(rawObservable);
      }
      return createMuseSignalQualityObservable(
        rawObservable,
        state$.value.device.connectedDevice
      );
    }),
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
      if (state$.value.device.deviceType === DEVICES.EMOTIV) {
        disconnectFromEmotiv();
      }
      disconnectFromMuse();
    }),
    map(DeviceActions.Cleanup)
  );

export default combineEpics(
  searchMuseEpic,
  searchEmotivEpic,
  deviceFoundEpic,
  searchTimerEpic,
  connectEpic,
  isConnectingEpic,
  setRawObservableEpic,
  setSignalQualityObservableEpic,
  deviceCleanupEpic
);
