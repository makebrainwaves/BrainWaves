// @flow
import {
  SET_EMOTIV_CLIENT,
  SET_MUSE_CLIENT,
  SET_CONNECTED_DEVICE,
  SET_DISCONNECTED,
  SET_RAW_OBSERVABLE,
  DEVICE_CLEANUP
} from "../epics/deviceEpics";
import { DEVICES } from "../constants/constants";
import { ActionType } from "../constants/interfaces";

export interface DeviceStateType {
  client: ?any;
  connectedDevice: Object;
  rawObservable: ?any;
  deviceType: DEVICES;
}

const initialState = {
  client: null,
  connectedDevice: { name: "disconnected" },
  rawObservable: null,
  deviceType: ""
};

export default function device(
  state: DeviceStateType = initialState,
  action: ActionType
) {
  switch (action.type) {
    case SET_EMOTIV_CLIENT:
      return {
        ...state,
        client: action.payload,
        deviceType: DEVICES.EMOTIV
      };

    case SET_MUSE_CLIENT:
      return {
        ...state,
        client: action.payload,
        deviceType: DEVICES.MUSE
      };

    case SET_CONNECTED_DEVICE:
      return {
        ...state,
        connectedDevice: action.payload
      };

    case SET_DISCONNECTED:
      return {
        ...state,
        connectedDevice: { name: "disconnected" }
      };

    case SET_RAW_OBSERVABLE:
      return {
        ...state,
        rawObservable: action.payload
      };

    case DEVICE_CLEANUP:
      return initialState;

    default:
      return state;
  }
}
