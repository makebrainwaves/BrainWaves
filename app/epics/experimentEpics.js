import { combineEpics } from "redux-observable";
import { map, pluck } from "rxjs/operators";
import { SET_TYPE } from "../actions/experimentActions";
import { DEVICES } from "../constants/constants";
import { loadTimeline } from "../utils/jspsych/functions";
import { injectMuseMarker } from "../utils/muse";
import { injectEmotivMarker } from "../utils/emotiv";

export const SET_TIMELINE = "LOAD_TIMELINE";

// -------------------------------------------------------------------------
// Action Creators

const setTimeline = payload => ({
  payload,
  type: SET_TIMELINE
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

export default combineEpics(loadDefaultTimelineEpic);
