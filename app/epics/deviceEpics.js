import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import { map, pluck, mergeMap, tap, filter, catchError } from "rxjs/operators";
import { epoch, bandpassFilter, addInfo } from "eeg-pipes";
import { addSignalQuality } from "../utils/eeg/pipes";
import {
  CONNECT_TO_DEVICE,
  SET_DEVICE_TYPE,
  SET_DEVICE_AVAILABILITY,
  setDeviceAvailability,
  setConnectionStatus
} from "../actions/deviceActions";
import {
  initCortex,
  getEmotiv,
  connectToEmotiv,
  createRawEmotivObservable
} from "../utils/eeg/emotiv";
import {
  initMuseClient,
  getMuse,
  connectToMuse,
  createRawMuseObservable
} from "../utils/eeg/muse";
import {
  CONNECTION_STATUS,
  DEVICES,
  DEVICE_AVAILABILITY,
  PLOTTING_INTERVAL,
  EMOTIV_CHANNELS,
  MUSE_CHANNELS
} from "../constants/constants";

export const SET_CLIENT = "SET_CLIENT";
export const SET_CONNECTION_STATUS = "SET_CONNECTION_STATUS";
export const SET_DEVICE_INFO = "SET_DEVICE_INFO";
export const SET_AVAILABLE_DEVICES = "SET_AVAILABLE_DEVICES";
export const SET_RAW_OBSERVABLE = "SET_RAW_OBSERVABLE";
export const SET_SIGNAL_OBSERVABLE = "SET_SIGNAL_OBSERVABLE";
export const DEVICE_CLEANUP = "DEVICE_CLEANUP";

// -------------------------------------------------------------------------
// Action Creators

const setClient = payload => ({
  payload,
  type: SET_CLIENT
});

const setRawObservable = payload => ({
  payload,
  type: SET_RAW_OBSERVABLE
});

const setSignalQualityObservable = payload => ({
  payload,
  type: SET_SIGNAL_OBSERVABLE
});

const setAvailableDevices = payload => ({
  payload,
  type: SET_AVAILABLE_DEVICES
});

const setDeviceInfo = payload => ({
  payload,
  type: SET_DEVICE_INFO
});

const cleanup = () => ({ type: DEVICE_CLEANUP });

// -------------------------------------------------------------------------
// Epics

const initEpic = action$ =>
  action$.ofType(SET_DEVICE_TYPE).pipe(
    pluck("payload"),
    map(deviceType => {
      if (deviceType === DEVICES.EMOTIV) {
        return initCortex();
      }
      return initMuseClient();
    }),
    map(setClient)
  );

// TODO: Add timeout
// NOTE: Uses a Promise.then inside b/c Observable.from leads to loss of user gesture propagation for web bluetooth
const searchEpic = (action$, store) =>
  action$.ofType(SET_DEVICE_AVAILABILITY).pipe(
    pluck("payload"),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    map(
      () =>
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? getEmotiv(store.getState().device.client)
          : getMuse()
    ),
    mergeMap(promise =>
      promise.then(
        devices => devices,
        error => {
          console.error("searchEpic: ", error);
          return [];
        }
      )
    ),
    mergeMap(devices => {
      if (devices.length > 1) {
        return Observable.of(
          setAvailableDevices(devices),
          setDeviceAvailability(DEVICE_AVAILABILITY.MULTIPLE_AVAILABLE)
        );
      }
      if (devices.length === 1) {
        return Observable.of(
          setAvailableDevices(devices),
          setDeviceAvailability(DEVICE_AVAILABILITY.SINGLE_AVAILABLE)
        );
      }
      return Observable.of(setDeviceAvailability(DEVICE_AVAILABILITY.NONE));
    })
  );

const connectEpic = (action$, store) =>
  action$.ofType(CONNECT_TO_DEVICE).pipe(
    pluck("payload"),
    map(
      device =>
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? connectToEmotiv(store.getState().device.client, device)
          : connectToMuse(store.getState().device.client, device)
    ),
    mergeMap(promise =>
      promise.then(
        deviceInfo => deviceInfo,
        error => {
          console.error("connectEpic: ", error);
          return null;
        }
      )
    ),
    tap(console.log),
    mergeMap(deviceInfo => {
      if (deviceInfo) {
        return Observable.of(
          setDeviceInfo(deviceInfo),
          setConnectionStatus(CONNECTION_STATUS.CONNECTED)
        );
      }
      return Observable.of(setConnectionStatus(CONNECTION_STATUS.DISCONNECTED));
    })
  );

// TODO: Bring this back and make it only look for disconnection events
// const autoConnectEpic = action$ =>
//   action$.ofType(SET_AVAILABLE_DEVICES).pipe(
//     pluck("payload"),
//     filter(availableDevices => availableDevices.length === 1),
//     map(availableDevices => availableDevices[0]),
//     map(connectToDevice)
//   );

const setRawObservableEpic = (action$, store) =>
  action$.ofType(SET_DEVICE_INFO).pipe(
    mergeMap(() => {
      if (store.getState().device.deviceType === DEVICES.EMOTIV) {
        return Observable.from(
          createRawEmotivObservable(store.getState().device.client)
        );
      }
      return Observable.from(
        createRawMuseObservable(store.getState().device.client)
      );
    }),
    mergeMap(observable => {
      const samplingRate =
        store.getState().device.deviceType === DEVICES.EMOTIV ? 128 : 256;
      const nbChannels =
        store.getState().device.deviceType === DEVICES.EMOTIV ? 14 : 5;
      const intervalSamples = (PLOTTING_INTERVAL * samplingRate) / 1000;
      return Observable.of(
        setRawObservable(observable),
        setSignalQualityObservable(
          observable.pipe(
            addInfo({
              samplingRate
            }),
            epoch({
              duration: intervalSamples,
              interval: intervalSamples
            }),
            bandpassFilter({
              nbChannels,
              lowCutoff: 1,
              highCutoff: 50
            }),
            addSignalQuality()
          )
        )
      );
    })
  );

// const connectionStatusListenerEpic = action$ =>
//   action$.ofType(SET_CLIENT).pipe(
//     pluck("payload"),
//     mergeMap(client => client.connectionStatus),
//     map(connectionStatus => {
//       if (connectionStatus) {
//         return setConnectionStatus(CONNECTION_STATUS.CONNECTED);
//       }
//       return setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
//     })
//   );

// const cleanupEpic = action$ =>
//   action$.ofType(SET_DEVICE_TYPE).pipe(map(cleanup));

// TODO: Fix this error handling so epics can refire once they error out
const rootEpic = (action$, state$) =>
  combineEpics(
    initEpic,
    searchEpic,
    connectEpic,
    // autoConnectEpic,
    setRawObservableEpic
  )(action$, state$).pipe(
    catchError(error =>
      Observable.of(error).pipe(
        tap(console.log),
        map(cleanup)
      )
    )
  );

export default rootEpic;
