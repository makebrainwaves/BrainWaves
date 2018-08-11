// @flow
import { Observable } from "rxjs/Observable";
import {
  SET_EMOTIV_CLIENT,
  SET_MUSE_CLIENT,
  SET_DEVICE_INFO,
  SET_AVAILABLE_DEVICES,
  SET_CONNECTION_STATUS,
  SET_DEVICE_AVAILABILITY,
  SET_RAW_OBSERVABLE,
  DEVICE_CLEANUP
} from "../epics/deviceEpics";
import {
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY
} from "../constants/constants";
import { ActionType, DeviceInfo } from "../constants/interfaces";
import { SET_DEVICE_TYPE } from "../actions/deviceActions";

interface DeviceStateType {
  +client: ?any;
  +connectedDevice: Object;
  +rawObservable: ?Observable;
  +deviceType: DEVICES;
}

const initialState = {
  client: null,
  availableDevices: [],
  connectedDevice: { name: "disconnected", samplingRate: 0 },
  connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
  deviceAvailability: DEVICE_AVAILABILITY.NONE,
  rawObservable: null,
  deviceType: DEVICES.NONE
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

    case SET_DEVICE_TYPE:
      return {
        ...state,
        deviceType: action.payload
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

    case SET_DEVICE_AVAILABILITY:
      return {
        ...state,
        SET_DEVICE_AVAILABILITY: action.payload
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
