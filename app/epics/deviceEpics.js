import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import { map, pluck, mergeMap, tap, filter, catchError } from "rxjs/operators";
import { epoch, bandpassFilter, addInfo } from "eeg-pipes";
import { isNil, union } from "lodash";
import { addSignalQuality, colorSignalQuality } from "../utils/eeg/pipes";
import {
  CONNECT_TO_DEVICE,
  SET_DEVICE_AVAILABILITY,
  setDeviceAvailability,
  setConnectionStatus
} from "../actions/deviceActions";
import {
  getEmotiv,
  connectToEmotiv,
  createRawEmotivObservable
} from "../utils/eeg/emotiv";
import {
  getMuse,
  connectToMuse,
  createRawMuseObservable
} from "../utils/eeg/muse";
import {
  CONNECTION_STATUS,
  DEVICES,
  DEVICE_AVAILABILITY,
  SEARCH_TIMER,
  PLOTTING_INTERVAL,
  EMOTIV_CHANNELS,
  MUSE_CHANNELS
} from "../constants/constants";

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

// NOTE: Uses a Promise.then inside b/c Observable.from leads to loss of user gesture propagation for web bluetooth
const searchMuseEpic = action$ =>
  action$.ofType(SET_DEVICE_AVAILABILITY).pipe(
    pluck("payload"),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    map(getMuse),
    mergeMap(promise =>
      promise.then(
        devices => devices,
        error => {
          console.error("searchMuseEpic: ", error);
          return [];
        }
      )
    ),
    filter(devices => devices.length >= 1),
    map(deviceFound)
  );

// TODO: Add timeout
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
          console.error("searchEpic: ", error);
          return [];
        }
      )
    ),
    filter(devices => devices.length >= 1),
    map(deviceFound)
  );

const deviceFoundEpic = (action$, store) =>
  action$.ofType(DEVICE_FOUND).pipe(
    pluck("payload"),
    tap(devices => console.log(devices)),
    map(foundDevices =>
      union(foundDevices, store.getState().device.availableDevices)
    ),
    mergeMap(devices =>
      Observable.of(
        setAvailableDevices(devices),
        setDeviceAvailability(DEVICE_AVAILABILITY.AVAILABLE)
      )
    )
  );

const searchTimerEpic = (action$, store) =>
  action$.ofType(SET_DEVICE_AVAILABILITY).pipe(
    pluck("payload"),
    filter(status => status === DEVICE_AVAILABILITY.SEARCHING),
    tap(() => console.log('tuimer start')),
    mergeMap(() => Observable.timer(SEARCH_TIMER)),
    tap(() => console.log('tuimer fired')),
    filter(
      () =>
        store.getState().device.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ),
    map(() => setDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );

const connectEpic = action$ =>
  action$.ofType(CONNECT_TO_DEVICE).pipe(
    pluck("payload"),
    map(
      device =>
        isNil(device.name) ? connectToEmotiv(device) : connectToMuse(device)
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
    mergeMap(deviceInfo => {
      if (deviceInfo) {
        return Observable.of(
          setDeviceType(
            deviceInfo.name.includes("Muse") ? DEVICES.MUSE : DEVICES.EMOTIV
          ),
          setDeviceInfo(deviceInfo),
          setConnectionStatus(CONNECTION_STATUS.CONNECTED)
        );
      }
      return Observable.of(setConnectionStatus(CONNECTION_STATUS.DISCONNECTED));
    })
  );

const isConnectingEpic = action$ =>
  action$
    .ofType(CONNECT_TO_DEVICE)
    .pipe(map(() => setConnectionStatus(CONNECTION_STATUS.CONNECTING)));

const setRawObservableEpic = (action$, store) =>
  action$.ofType(SET_DEVICE_INFO).pipe(
    mergeMap(() => {
      if (store.getState().device.deviceType === DEVICES.EMOTIV) {
        return Observable.from(createRawEmotivObservable());
      }
      return Observable.from(createRawMuseObservable());
    }),
    mergeMap(observable => {
      const samplingRate =
        store.getState().device.deviceType === DEVICES.EMOTIV ? 128 : 256;
      const channelNames =
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS
          : MUSE_CHANNELS;
      const nbChannels =
        store.getState().device.deviceType === DEVICES.EMOTIV ? 14 : 5;
      const intervalSamples = (PLOTTING_INTERVAL * samplingRate) / 1000;
      return Observable.of(
        setRawObservable(observable),
        setSignalQualityObservable(
          observable.pipe(
            addInfo({
              samplingRate,
              channelNames
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
            addSignalQuality(),
            colorSignalQuality()
          )
        )
      );
    })
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
