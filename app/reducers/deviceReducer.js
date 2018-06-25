// @flow
import {
  SET_EMOTIV_CLIENT,
  SET_MUSE_CLIENT,
  SET_CONNECTED_DEVICE,
  SET_DISCONNECTED,
  SET_RAW_OBSERVABLE,
  DEVICE_CLEANUP
} from "../epics/deviceEpics";

export type deviceStateType = {
  client: ?any,
  connectedDevice: Object,
  rawObservable: ?any,
  deviceType: string
};

type actionType = {
  +payload: any,
  +type: string
};

const initialState = {
  client: null,
  connectedDevice: { name: "disconnected" },
  rawObservable: null,
  deviceType: ""
};

export default function device(
  state: deviceStateType = initialState,
  action: actionType
) {
  switch (action.type) {
    case SET_EMOTIV_CLIENT:
      return {
        ...state,
        client: action.payload,
        deviceType: "EMOTIV"
      };

    case SET_MUSE_CLIENT:
      return {
        ...state,
        client: action.payload,
        deviceType: "MUSE"
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
