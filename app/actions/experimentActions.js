// -------------------------------------------------------------------------
// Action Types

export const START = "START";
export const PAUSE = "PAUSE";
export const STOP = "STOP";
export const SET_TYPE = "SET_TYPE";

// -------------------------------------------------------------------------
// Actions;

export const start = () => ({ type: START });
export const pause = () => ({ type: PAUSE });
export const stop = () => ({ type: STOP });
export const setType = payload => ({ payload, type: SET_TYPE });
