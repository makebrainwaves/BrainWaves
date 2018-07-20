// -------------------------------------------------------------------------
// Action Types

export const INIT_EMOTIV = "INIT_EMOTIV";
export const INIT_MUSE = "INIT_MUSE";
export const SET_DEVICE_TYPE = "SET_DEVICE_TYPE";

// -------------------------------------------------------------------------
// Actions

export const initEmotiv = () => ({ type: INIT_EMOTIV });
export const initMuse = () => ({ type: INIT_MUSE });
export const setDeviceType = payload => ({ payload, type: SET_DEVICE_TYPE });
