// -------------------------------------------------------------------------
// Action Types

export const START = "START";
export const PAUSE = "PAUSE";
export const STOP = "STOP";
export const SET_TYPE = "SET_TYPE";
export const SET_SUBJECT = "SET_SUBJECT";
export const SET_SESSION = "SET_SESSION";
export const LOAD_DEFAULT_TIMELINE = "LOAD_DEFAULT_TIMELINE";

// -------------------------------------------------------------------------
// Actions;

export const start = () => ({ type: START });
export const pause = () => ({ type: PAUSE });
export const stop = () => ({ type: STOP });
export const setType = payload => ({ payload, type: SET_TYPE });
export const setSubject = payload => ({ payload, type: SET_SUBJECT });
export const setSession = payload => ({ payload, type: SET_SESSION });
export const loadDefaultTimeline = () => ({ type: LOAD_DEFAULT_TIMELINE });
