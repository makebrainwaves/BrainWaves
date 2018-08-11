import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import {
  map,
  pluck,
  mergeMap,
  tap,
  filter,
  catchError,
  ignoreElements,
  timeout
} from "rxjs/operators";
import { isNil } from "lodash";
import {
  CONNECT_TO_DEVICE,
  SET_DEVICE_TYPE,
  SET_DEVICE_AVAILABILITY,
  setDeviceAvailability,
  setConnectionStatus,
  connectToDevice
} from "../actions/deviceActions";
import {
  initCortex,
  getEmotiv,
  connectToEmotiv,
  createRawEmotivObservable
} from "../utils/eeg/emotiv";
import {
  initMuseClient,
  createRawMuseObservable,
  connectMuse
} from "../utils/eeg/muse";
import {
  CONNECTION_STATUS,
  DEVICES,
  DEVICE_AVAILABILITY
} from "../constants/constants";

export const SET_CLIENT = "SET_CLIENT";
export const SET_CONNECTION_STATUS = "SET_CONNECTION_STATUS";
export const SET_DEVICE_INFO = "SET_DEVICE_INFO";
export const SET_AVAILABLE_DEVICES = "SET_AVAILABLE_DEVICES";
export const SET_RAW_OBSERVABLE = "SET_RAW_OBSERVABLE";
export const DEVICE_CLEANUP = "SET_DISCONNECTED";

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

const setConnected = () => ({
  type: SET_CONNECTED
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
const searchEpic = (action$, store) =>
  action$.ofType(SET_DEVICE_AVAILABILITY).pipe(
    tap(console.log),
    pluck("payload"),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    mergeMap(() =>
      Observable.from(
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? getEmotiv(store.getState().device.client)
          : getMuse()
      ).pipe(
        map(setAvailableDevices),
        catchError(error =>
          Observable.of(error).pipe(
            tap(console.error),
            map(() => setDeviceAvailability(DEVICE_AVAILABILITY.NONE))
          )
        )
      )
    )
  );

const connectEpic = (action$, store) =>
  action$.ofType(CONNECT_TO_DEVICE).pipe(
    pluck("payload"),
    mergeMap(device =>
      Observable.from(
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? connectToEmotiv(store.getState().device.client, device)
          : connectToMuse(store.getState().device.client, device)
      ).pipe(
        map(setDeviceInfo),
        catchError(error =>
          Observable.of(error).pipe(
            tap(console.error),
            map(() => setConnectionStatus(CONNECTION_STATUS.DISCONNECTED))
          )
        )
      )
    )
  );

const autoConnectEpic = action$ =>
  action$.ofType(SET_AVAILABLE_DEVICES).pipe(
    pluck("payload"),
    filter(availableDevices => availableDevices.length === 1),
    map(availableDevices => availableDevices[0]),
    map(connectToDevice)
  );

const setRawMuseObservable = (action$, store) =>
  action$.ofType(SET_CONNECTED).pipe(
    mergeMap(() =>
      Observable.from(createRawMuseObservable(store.getState().device.client))
    ),
    map(setRawObservable)
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
    autoConnectEpic,
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
