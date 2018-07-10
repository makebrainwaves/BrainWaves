import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import { map, pluck, mergeMap, filter } from "rxjs/operators";
import { INIT_MUSE, INIT_EMOTIV } from "../actions/deviceActions";
import { initCortex, createRawEmotivObservable } from "../utils/emotiv";
import { initMuseClient, createRawMuseObservable } from "../utils/muse";

export const SET_EMOTIV_CLIENT = "SET_EMOTIV_CLIENT";
export const SET_MUSE_CLIENT = "SET_MUSE_CLIENT";
export const SET_CONNECTED_DEVICE = "SET_CONNECTED_DEVICE";
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

// -------------------------------------------------------------------------
// Epics

const initEmotivEpic = (action$, store) =>
  action$.ofType(INIT_EMOTIV).pipe(
    filter(() => !store.getState().device.client),
    map(initCortex),
    map(setEmotivClient)
  );

const initMuseEpic = (action$, store) =>
  action$.ofType(INIT_MUSE).pipe(
    filter(() => !store.getState().device.client),
    map(initMuseClient),
    map(setMuseClient)
  );

const setRawEmotivObservable = action$ =>
  action$.ofType(SET_EMOTIV_CLIENT).pipe(
    pluck("payload"),
    map(client => createRawEmotivObservable(client)),
    map(setRawObservable)
  );

const setRawMuseObservable = action$ =>
  action$.ofType(SET_MUSE_CLIENT).pipe(
    pluck("payload"),
    mergeMap(client => Observable.from(createRawMuseObservable(client))),
    map(setRawObservable)
  );

export default combineEpics(
  initEmotivEpic,
  initMuseEpic,
  setRawMuseObservable,
  setRawEmotivObservable
);
