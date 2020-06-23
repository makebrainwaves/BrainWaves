import { EXPERIMENT_CLEANUP } from "../epics/experimentEpics";
// -------------------------------------------------------------------------
// Action Types

export const INIT_EMOTIV = 'INIT_EMOTIV';
export const INIT_MUSE = 'INIT_MUSE';
export const CONNECT_TO_DEVICE = 'CONNECT_TO_DEVICE';
export const SET_DEVICE_TYPE = 'SET_DEVICE_TYPE';
export const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';
export const SET_DEVICE_AVAILABILITY = 'SET_DEVICE_AVAILABILITY';

// -------------------------------------------------------------------------
// Actions

export const connectToDevice = payload => ({
  payload,
  type: CONNECT_TO_DEVICE
});
export const disconnectFromDevice = payload => ({
  payload,
  type: EXPERIMENT_CLEANUP
});
export const setConnectionStatus = payload => ({
  payload,
  type: SET_CONNECTION_STATUS
});
export const setDeviceAvailability = payload => ({
  payload,
  type: SET_DEVICE_AVAILABILITY
});