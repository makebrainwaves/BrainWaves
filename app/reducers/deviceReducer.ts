import { Observable } from 'rxjs';
import {
  SET_DEVICE_INFO,
  SET_DEVICE_TYPE,
  SET_AVAILABLE_DEVICES,
  SET_CONNECTION_STATUS,
  SET_RAW_OBSERVABLE,
  SET_SIGNAL_OBSERVABLE,
  DEVICE_CLEANUP
} from '../epics/deviceEpics';
import {
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY
} from '../constants/constants';
import { ActionType, DeviceInfo } from '../constants/interfaces';
import { SET_DEVICE_AVAILABILITY } from '../actions/deviceActions';

interface DeviceStateType {
  readonly availableDevices: Array<any>;
  readonly connectedDevice: DeviceInfo | null | undefined;
  readonly connectionStatus: CONNECTION_STATUS;
  readonly deviceAvailability: DEVICE_AVAILABILITY;
  readonly rawObservable: Observable | null | undefined;
  readonly signalQualityObservable: Observable | null | undefined;
  readonly deviceType: DEVICES;
}

const initialState = {
  availableDevices: [],
  connectedDevice: { name: 'disconnected', samplingRate: 0 },
  connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
  deviceAvailability: DEVICE_AVAILABILITY.NONE,
  rawObservable: null,
  signalQualityObservable: null,
  deviceType: DEVICES.EMOTIV
};

export default function device(
  state: DeviceStateType = initialState,
  action: ActionType
) {
  switch (action.type) {
    case SET_DEVICE_TYPE:
      return {
        ...state,
        deviceType: action.payload
      };

    case SET_DEVICE_INFO:
      return {
        ...state,
        connectedDevice: action.payload
      };

    case SET_AVAILABLE_DEVICES:
      return {
        ...state,
        availableDevices: action.payload
      };

    case SET_CONNECTION_STATUS:
      return {
        ...state,
        connectionStatus: action.payload
      };

    case SET_DEVICE_AVAILABILITY:
      return {
        ...state,
        deviceAvailability: action.payload
      };

    case SET_RAW_OBSERVABLE:
      return {
        ...state,
        rawObservable: action.payload
      };

    case SET_SIGNAL_OBSERVABLE:
      return {
        ...state,
        signalQualityObservable: action.payload
      };

    case DEVICE_CLEANUP:
      return initialState;

    default:
      return state;
  }
}
