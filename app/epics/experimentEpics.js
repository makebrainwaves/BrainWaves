import { combineEpics } from "redux-observable";
import { map, mapTo, pluck, filter } from "rxjs/operators";
import { SET_TYPE, START } from "../actions/experimentActions";
import { DEVICES } from "../constants/constants";
import { loadTimeline } from "../utils/jspsych/functions";
import { injectMuseMarker } from "../utils/muse";
import { injectEmotivMarker } from "../utils/emotiv";

export const SET_TIMELINE = "LOAD_TIMELINE";
export const SET_IS_RUNNING = "SET_IS_RUNNING";

// -------------------------------------------------------------------------
// Action Creators

const setTimeline = payload => ({
  payload,
  type: SET_TIMELINE
});

const setIsRunning = payload => ({
  payload,
  type: SET_IS_RUNNING
});

// -------------------------------------------------------------------------
// Epics

const loadDefaultTimelineEpic = (action$, store) =>
  action$.ofType(SET_TYPE).pipe(
    pluck("payload"),
    map(type => {
      if (store.getState().device.deviceType === DEVICES.EMOTIV) {
        return loadTimeline(type, value =>
          injectEmotivMarker(
            store.getState().device.client,
            value,
            new Date().getTime()
          )
        );
      }
      return loadTimeline(type, value =>
        injectMuseMarker(
          store.getState().device.client,
          value,
          new Date().getTime()
        )
      );
    }),
    map(setTimeline)
  );

const startEpic = (action$, store) =>
  action$.ofType(START).pipe(
    filter(
      () =>
        !store.getState().experiment.isRunning &&
        store.getState().experiment.subject !== ""
    ),
    mapTo(true),
    map(setIsRunning)
  );

export default combineEpics(loadDefaultTimelineEpic, startEpic);
