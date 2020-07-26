import { Observable } from 'rxjs';
import { createReducer } from '@reduxjs/toolkit';
import {
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  SIGNAL_QUALITY
} from '../constants/constants';
import {
  DeviceInfo,
  Device,
  EEGData,
  SignalQualityData
} from '../constants/interfaces';
import { DeviceActions } from '../actions';

export interface DeviceStateType {
  readonly availableDevices: Array<Device>;
  readonly connectedDevice: DeviceInfo | null | undefined;
  readonly connectionStatus: CONNECTION_STATUS;
  readonly deviceAvailability: DEVICE_AVAILABILITY;
  // TODO: type EEG data
  readonly rawObservable: Observable<EEGData> | null;
  readonly signalQualityObservable: Observable<SignalQualityData> | null;
  readonly deviceType: DEVICES;
}

const initialState: DeviceStateType = {
  availableDevices: [{}],
  connectedDevice: { name: 'disconnected', samplingRate: 0 },
  connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
  deviceAvailability: DEVICE_AVAILABILITY.NONE,
  rawObservable: null,
  signalQualityObservable: null,
  deviceType: DEVICES.EMOTIV
};

export default createReducer(initialState, builder =>
  builder
    .addCase(DeviceActions.ConnectToDevice, (state, action) => {
      return {
        ...state,
        deviceType: action.payload
      };
    })
    .addCase(DeviceActions.SetDeviceInfo, (state, action) => {
      return {
        ...state,
        connectedDevice: action.payload
      };
    })

    .addCase(DeviceActions.SetAvailableDevices, (state, action) => {
      return {
        ...state,
        availableDevices: action.payload
      };
    })
    .addCase(DeviceActions.SetConnectionStatus, (state, action) => {
      return {
        ...state,
        connectionStatus: action.payload
      };
    })
    .addCase(DeviceActions.SetDeviceAvailability, (state, action) => {
      return {
        ...state,
        deviceAvailability: action.payload
      };
    })

    .addCase(DeviceActions.SetRawObservable, (state, action) => {
      return {
        ...state,
        rawObservable: action.payload
      };
    })

    .addCase(DeviceActions.SetSignalQualityObservable, (state, action) => {
      return {
        ...state,
        signalQualityObservable: action.payload
      };
    })
    .addCase(DeviceActions.Cleanup, (state, action) => {
      return initialState;
    })
);
