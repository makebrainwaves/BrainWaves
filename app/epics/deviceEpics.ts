import { combineEpics } from 'redux-observable';
import { of, from, timer, ObservableInput } from 'rxjs';
import { map, pluck, mergeMap, tap, filter, catchError } from 'rxjs/operators';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import { DeviceActions } from '../actions';
import {
  getEmotiv,
  connectToEmotiv,
  createRawEmotivObservable,
  createEmotivSignalQualityObservable,
  disconnectFromEmotiv
} from '../utils/eeg/emotiv';
import {
  getMuse,
  connectToMuse,
  createRawMuseObservable,
  createMuseSignalQualityObservable,
  disconnectFromMuse
} from '../utils/eeg/muse';
import {
  CONNECTION_STATUS,
  DEVICES,
  DEVICE_AVAILABILITY,
  SEARCH_TIMER
} from '../constants/constants';
import { Device, DeviceInfo } from '../constants/interfaces';

// -------------------------------------------------------------------------
// Epics

// NOTE: Uses a Promise "then" inside b/c Observable.from leads to loss of user gesture propagation for web bluetooth
const searchMuseEpic = action$ =>
  action$.ofType(DeviceActions.SetDeviceAvailability.type).pipe(
    pluck('payload'),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    map(getMuse),
    mergeMap<Promise<{}[] | null>, ObservableInput<any>>(promise =>
      promise.then(
        devices => devices,
        error => {
          // This error will fire a bit too promiscuously until we fix windows web bluetooth
          // toast.error(`"Device Error: " ${error.toString()}`);
          return [];
        }
      )
    ),
    filter<Device[]>(devices => isNil(devices)), // filter out nulls if running on win7
    filter<Device[]>(devices => devices.length >= 1),
    map(DeviceActions.DeviceFound)
  );

const searchEmotivEpic = action$ =>
  action$.ofType(DeviceActions.SetDeviceAvailability.type).pipe(
    pluck('payload'),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    filter(() => process.platform === 'darwin' || process.platform === 'win32'),
    map(getEmotiv),
    mergeMap<Promise<any>, ObservableInput<any>>(promise =>
      promise.then(
        devices => devices,
        error => {
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
    filter<any[]>(devices => devices.length >= 1),
    map(DeviceActions.DeviceFound)
  );

const deviceFoundEpic = (action$, state$) =>
  action$.ofType(DeviceActions.DeviceFound.type).pipe(
    pluck('payload'),
    map<Device[], Device[]>(foundDevices =>
      foundDevices.reduce((acc, curr) => {
        if (acc.find(device => device.id === curr.id)) {
          return acc;
        }
        return acc.concat(curr);
      }, state$.value.device.availableDevices)
    ),
    mergeMap<Device[], ObservableInput<any>>(devices =>
      of(
        DeviceActions.SetAvailableDevices(devices),
        DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.AVAILABLE)
      )
    )
  );

const searchTimerEpic = (action$, state$) =>
  action$.ofType(DeviceActions.SetDeviceAvailability.type).pipe(
    pluck('payload'),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    mergeMap(() => timer(SEARCH_TIMER)),
    filter(
      () =>
        state$.value.device.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ),
    map(() => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );

const connectEpic = action$ =>
  action$.ofType(DeviceActions.ConnectToDevice.type).pipe(
    pluck('payload'),
    map<Device, Promise<any>>(device =>
      isNil(device.name) ? connectToEmotiv(device) : connectToMuse(device)
    ),
    mergeMap<Promise<any>, ObservableInput<DeviceInfo>>(promise =>
      promise.then(deviceInfo => deviceInfo)
    ),
    mergeMap<DeviceInfo, ObservableInput<any>>(deviceInfo => {
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

const isConnectingEpic = action$ =>
  action$
    .ofType(DeviceActions.ConnectToDevice.type)
    .pipe(
      map(() => DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTING))
    );

const setRawObservableEpic = (action$, state$) =>
  action$.ofType(DeviceActions.SetDeviceInfo.type).pipe(
    mergeMap(() => {
      if (state$.value.device.deviceType === DEVICES.EMOTIV) {
        return from(createRawEmotivObservable());
      }
      return from(createRawMuseObservable());
    }),
    map(DeviceActions.SetRawObservable)
  );

const setSignalQualityObservableEpic = (action$, state$) =>
  action$.ofType(DeviceActions.SetRawObservable.type).pipe(
    pluck('payload'),
    map(rawObservable => {
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

const deviceCleanupEpic = (action$, state$) =>
  action$.ofType(ExperimentActions.ExperimentCleanup.type).pipe(
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

// TODO: Fix this error handling so epics can refire once they error out
const rootEpic = (action$, state$) =>
  combineEpics(
    searchMuseEpic,
    searchEmotivEpic,
    deviceFoundEpic,
    searchTimerEpic,
    connectEpic,
    isConnectingEpic,
    setRawObservableEpic,
    setSignalQualityObservableEpic,
    deviceCleanupEpic
  )(action$, state$).pipe(
    catchError(error =>
      of(error).pipe(
        tap(err => toast.error(`"Device Error: " ${err.toString()}`)),
        map(DeviceActions.Cleanup)
      )
    )
  );

export default rootEpic;
