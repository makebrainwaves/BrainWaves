import { combineEpics } from "redux-observable";
import { of, from, timer } from "rxjs";
import { map, pluck, mergeMap, tap, filter, catchError } from "rxjs/operators";
import { isNil } from "lodash";
import { toast } from "react-toastify";
import {
  CONNECT_TO_DEVICE,
  SET_DEVICE_AVAILABILITY,
  setDeviceAvailability,
  setConnectionStatus
} from "../actions/deviceActions";
import {
  getEmotiv,
  connectToEmotiv,
  createRawEmotivObservable,
  createEmotivSignalQualityObservable,
  disconnectFromEmotiv
} from "../utils/eeg/emotiv";
import {
  getMuse,
  connectToMuse,
  createRawMuseObservable,
  createMuseSignalQualityObservable,
  disconnectFromMuse
} from "../utils/eeg/muse";
import {
  CONNECTION_STATUS,
  DEVICES,
  DEVICE_AVAILABILITY,
  SEARCH_TIMER
} from "../constants/constants";
import { EXPERIMENT_CLEANUP } from "./experimentEpics";

export const DEVICE_FOUND = "DEVICE_FOUND";
export const SET_DEVICE_TYPE = "DEVICE_TYPE";
export const SET_CONNECTION_STATUS = "SET_CONNECTION_STATUS";
export const SET_DEVICE_INFO = "SET_DEVICE_INFO";
export const SET_AVAILABLE_DEVICES = "SET_AVAILABLE_DEVICES";
export const SET_RAW_OBSERVABLE = "SET_RAW_OBSERVABLE";
export const SET_SIGNAL_OBSERVABLE = "SET_SIGNAL_OBSERVABLE";
export const DEVICE_CLEANUP = "DEVICE_CLEANUP";

// -------------------------------------------------------------------------
// Action Creators

const deviceFound = payload => ({
  payload,
  type: DEVICE_FOUND
});

const setDeviceType = payload => ({
  payload,
  type: SET_DEVICE_TYPE
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

// NOTE: Uses a Promise "then" inside b/c Observable.from leads to loss of user gesture propagation for web bluetooth
const searchMuseEpic = action$ =>
  action$.ofType(SET_DEVICE_AVAILABILITY).pipe(
    pluck("payload"),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    map(getMuse),
    mergeMap(promise =>
      promise.then(
        devices => devices,
        error => {
          toast.error(`"Device Error: " ${error.toString()}`);
          return [];
        }
      )
    ),
    filter(devices => devices), // filter out nulls if running on win7
    filter(devices => devices.length >= 1),
    map(deviceFound)
  );

const searchEmotivEpic = action$ =>
  action$.ofType(SET_DEVICE_AVAILABILITY).pipe(
    pluck("payload"),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    filter(() => process.platform === "darwin" || process.platform === "win32"),
    map(getEmotiv),
    mergeMap(promise =>
      promise.then(
        devices => devices,
        error => {
          if (error.message.includes("client.queryHeadsets")) {
            toast.error(
              "Could not connect to Cortex Service. Please connect to the internet and install Cortex to use Emotiv EEG",
              { autoclose: 7000 }
            );
          } else {
            toast.error(`"Device Error: " ${error.toString()}`);
          }
          console.error("searchEpic: ", error.toString());
          return [];
        }
      )
    ),
    filter(devices => devices.length >= 1),
    map(deviceFound)
  );

const deviceFoundEpic = (action$, state$) =>
  action$.ofType(DEVICE_FOUND).pipe(
    pluck("payload"),
    map(foundDevices =>
      foundDevices.reduce((acc, curr) => {
        if (acc.find(device => device.id === curr.id)) {
          return acc;
        }
        return acc.concat(curr);
      }, state$.value.device.availableDevices)
    ),
    mergeMap(devices =>
      of(
        setAvailableDevices(devices),
        setDeviceAvailability(DEVICE_AVAILABILITY.AVAILABLE)
      )
    )
  );

const searchTimerEpic = (action$, state$) =>
  action$.ofType(SET_DEVICE_AVAILABILITY).pipe(
    pluck("payload"),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    mergeMap(() => timer(SEARCH_TIMER)),
    filter(
      () =>
        state$.value.device.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ),
    map(() => setDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );

const connectEpic = action$ =>
  action$.ofType(CONNECT_TO_DEVICE).pipe(
    pluck("payload"),
    map(device =>
      isNil(device.name) ? connectToEmotiv(device) : connectToMuse(device)
    ),
    mergeMap(promise => promise.then(deviceInfo => deviceInfo)),
    mergeMap(deviceInfo => {
      if (!isNil(deviceInfo.samplingRate)) {
        return of(
          setDeviceType(
            deviceInfo.name.includes("Muse") ? DEVICES.MUSE : DEVICES.EMOTIV
          ),
          setDeviceInfo(deviceInfo),
          setConnectionStatus(CONNECTION_STATUS.CONNECTED)
        );
      }
      return of(setConnectionStatus(CONNECTION_STATUS.DISCONNECTED));
    })
  );

const isConnectingEpic = action$ =>
  action$
    .ofType(CONNECT_TO_DEVICE)
    .pipe(map(() => setConnectionStatus(CONNECTION_STATUS.CONNECTING)));

const setRawObservableEpic = (action$, state$) =>
  action$.ofType(SET_DEVICE_INFO).pipe(
    mergeMap(() => {
      if (state$.value.device.deviceType === DEVICES.EMOTIV) {
        return from(createRawEmotivObservable());
      }
      return from(createRawMuseObservable());
    }),
    map(setRawObservable)
  );

const setSignalQualityObservableEpic = (action$, state$) =>
  action$.ofType(SET_RAW_OBSERVABLE).pipe(
    pluck("payload"),
    map(rawObservable => {
      if (state$.value.device.deviceType === DEVICES.EMOTIV) {
        return createEmotivSignalQualityObservable(
          rawObservable,
          state$.value.device.connectedDevice
        );
      }
      return createMuseSignalQualityObservable(
        rawObservable,
        state$.value.device.connectedDevice
      );
    }),
    map(setSignalQualityObservable)
  );

const deviceCleanupEpic = (action$, state$) =>
  action$.ofType(EXPERIMENT_CLEANUP).pipe(
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
    map(cleanup)
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
        map(cleanup)
      )
    )
  );

export default rootEpic;
