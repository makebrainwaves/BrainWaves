import { combineEpics } from "redux-observable";
import { INIT_CLIENT } from "../actions/deviceActions";
import { map, tap, filter } from "rxjs/operators";
import {
  initCortex,
  createRawEmotivObservable,
  createStream
} from "../utils/emotiv";

export const SET_CLIENT = "SET_CLIENT";
export const SET_CONNECTED_DEVICE = "SET_CONNECTED_DEVICE";
export const SET_DISCONNECTED = "SET_DISCONNECTED";
export const SET_RAW_OBSERVABLE = "SET_RAW_OBSERVABLE";
export const DEVICE_CLEANUP = "SET_DISCONNECTED";

// -------------------------------------------------------------------------
// Action Creators

const setRawObservable = payload => ({
  payload,
  type: SET_RAW_OBSERVABLE
});

// -------------------------------------------------------------------------
// Epics

const setClientEpic = (action$, store) =>
  action$.ofType(INIT_CLIENT).pipe(
    filter(() => !store.getState().device.client),
    map(initCortex),
    map(client => setRawObservable(createRawEmotivObservable(client)))
  );

export default combineEpics(setClientEpic);
