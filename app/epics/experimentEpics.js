import { combineEpics } from "redux-observable";
import { map, pluck } from "rxjs/operators";
import { SET_TYPE } from "../actions/experimentActions";
import { loadTimeline } from "../utils/jspsych/functions";

export const SET_TIMELINE = "LOAD_TIMELINE";

// -------------------------------------------------------------------------
// Action Creators

const setTimeline = payload => ({
  payload,
  type: SET_TIMELINE
});

// -------------------------------------------------------------------------
// Epics

const loadDefaultTimelineEpic = action$ =>
  action$.ofType(SET_TYPE).pipe(
    pluck("payload"),
    map(type => loadTimeline(type, console.log)),
    map(setTimeline)
  );

export default combineEpics(loadDefaultTimelineEpic);
