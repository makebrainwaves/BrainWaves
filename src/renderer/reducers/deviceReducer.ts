import { Observable } from 'rxjs';
import { createReducer } from '@reduxjs/toolkit';
import {
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
} from '../constants/constants';
import {
  DeviceInfo,
  Device,
  EEGData,
  SignalQualityData,
} from '../constants/interfaces';
import { DeviceActions } from '../actions';
import type { DiscoveredStream } from '../../shared/lslTypes';

export interface DeviceStateType {
  readonly availableDevices: Array<Device>;
  readonly availableLSLStreams: Array<DiscoveredStream>;
  readonly connectedDevice: DeviceInfo | null | undefined;
  readonly connectionStatus: CONNECTION_STATUS;
  readonly deviceAvailability: DEVICE_AVAILABILITY;
  // TODO: type EEG data
  readonly rawObservable: Observable<EEGData> | null;
  readonly signalQualityObservable: Observable<SignalQualityData> | null;
  readonly deviceType: DEVICES;
}

const initialState: DeviceStateType = {
  availableDevices: [],
  availableLSLStreams: [],
  connectedDevice: { name: 'disconnected', samplingRate: 0, channels: [] },
  connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
  deviceAvailability: DEVICE_AVAILABILITY.NONE,
  rawObservable: null,
  signalQualityObservable: null,
  deviceType: DEVICES.MUSE,
};

/**
 * Enters a search. A new search clears a previous failed connect, so its
 * result is never shown as "Couldn't connect".
 */
const startSearch = (state: DeviceStateType): DeviceStateType => ({
  ...state,
  deviceAvailability: DEVICE_AVAILABILITY.SEARCHING,
  connectionStatus:
    state.connectionStatus === CONNECTION_STATUS.DISCONNECTED
      ? CONNECTION_STATUS.NOT_YET_CONNECTED
      : state.connectionStatus,
});

export default createReducer(initialState, (builder) =>
  builder
    .addCase(DeviceActions.ConnectToDevice, (state) => ({
      ...state,
      connectionStatus: CONNECTION_STATUS.CONNECTING,
    }))
    // An LSL connection is LSL-typed before SetDeviceInfo, so
    // setRawObservableEpic never starts a Bluetooth driver for it.
    .addCase(DeviceActions.ConnectToLSLStream, (state) => ({
      ...state,
      deviceType: DEVICES.LSL,
      connectionStatus: CONNECTION_STATUS.CONNECTING,
    }))
    .addCase(DeviceActions.SetDeviceType, (state, action) => {
      return {
        ...state,
        deviceType: action.payload,
      };
    })
    .addCase(DeviceActions.SetDeviceInfo, (state, action) => {
      return {
        ...state,
        connectedDevice: action.payload,
      };
    })
    // Each Web Bluetooth search answers with the one device it picked; earlier
    // results are stale (possibly off or taken), so the list is replaced.
    .addCase(DeviceActions.DeviceFound, (state, action) => ({
      ...state,
      availableDevices: action.payload,
      deviceAvailability: DEVICE_AVAILABILITY.AVAILABLE,
    }))
    .addCase(DeviceActions.SetConnectionStatus, (state, action) => {
      return {
        ...state,
        connectionStatus: action.payload,
      };
    })
    .addCase(DeviceActions.SetDeviceAvailability, (state, action) =>
      action.payload === DEVICE_AVAILABILITY.SEARCHING
        ? startSearch(state)
        : { ...state, deviceAvailability: action.payload }
    )

    .addCase(DeviceActions.SetRawObservable, (state, action) => {
      return {
        ...state,
        rawObservable: action.payload,
      };
    })

    .addCase(DeviceActions.SetSignalQualityObservable, (state, action) => {
      return {
        ...state,
        signalQualityObservable: action.payload,
      };
    })
    // Keeps the student's chosen device type across a disconnect or cancel.
    .addCase(DeviceActions.Cleanup, (state) => ({
      ...initialState,
      deviceType: state.deviceType,
    }))
    .addCase(DeviceActions.DiscoverLSLStreams, startSearch)
    .addCase(DeviceActions.SetAvailableLSLStreams, (state, action) => ({
      ...state,
      availableLSLStreams: action.payload,
      deviceAvailability: action.payload.length
        ? DEVICE_AVAILABILITY.AVAILABLE
        : DEVICE_AVAILABILITY.NONE,
    }))
);
