import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import { map, pluck, mergeMap, tap } from "rxjs/operators";
import { INIT_MUSE, INIT_EMOTIV } from "../actions/deviceActions";
import { initCortex, createRawEmotivObservable } from "../utils/eeg/emotiv";
import {
  initMuseClient,
  createRawMuseObservable,
  connectMuse
} from "../utils/eeg/muse";

export const SET_EMOTIV_CLIENT = "SET_EMOTIV_CLIENT";
export const SET_MUSE_CLIENT = "SET_MUSE_CLIENT";
export const SET_CONNECTED = "SET_CONNECTED";
export const CONNECT_ATTEMPT_COMPLETE = "CONNECT_ATTEMPT_COMPLETE";
export const SET_DISCONNECTED = "SET_DISCONNECTED";
export const SET_RAW_OBSERVABLE = "SET_RAW_OBSERVABLE";
export const DEVICE_CLEANUP = "SET_DISCONNECTED";

// -------------------------------------------------------------------------
// Action Creators

const setEmotivClient = payload => ({
  payload,
  type: SET_EMOTIV_CLIENT
});

const setMuseClient = payload => ({
  payload,
  type: SET_MUSE_CLIENT
});

const setRawObservable = payload => ({
  payload,
  type: SET_RAW_OBSERVABLE
});

const setConnected = () => ({
  type: SET_CONNECTED
});

const setDisconnected = () => ({
  type: SET_DISCONNECTED
});

// -------------------------------------------------------------------------
// Epics

const initEmotivEpic = action$ =>
  action$.ofType(INIT_EMOTIV).pipe(
    map(initCortex),
    map(setEmotivClient)
  );

const initMuseEpic = action$ =>
  action$.ofType(INIT_MUSE).pipe(
    map(initMuseClient),
    tap(connectMuse),
    map(setMuseClient)
  );

const setRawEmotivObservable = action$ =>
  action$.ofType(SET_EMOTIV_CLIENT).pipe(
    pluck("payload"),
    map(client => createRawEmotivObservable(client)),
    map(setRawObservable)
  );

const setRawMuseObservable = (action$, store) =>
  action$.ofType(SET_CONNECTED).pipe(
    mergeMap(() =>
      Observable.from(createRawMuseObservable(store.getState().device.client))
    ),
    map(setRawObservable)
  );

const connectionStatusListenerEpic = action$ =>
  action$.ofType(SET_MUSE_CLIENT).pipe(
    pluck("payload"),
    mergeMap(client => client.connectionStatus),
    map(connectionStatus => {
      if (connectionStatus) {
        return setConnected();
      }
      return setDisconnected();
    })
  );

export default combineEpics(
  initEmotivEpic,
  initMuseEpic,
  setRawMuseObservable,
  setRawEmotivObservable,
  connectionStatusListenerEpic
);
