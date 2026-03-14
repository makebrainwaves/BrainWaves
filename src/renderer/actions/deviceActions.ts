import { createAction } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';
import { DEVICE_AVAILABILITY, CONNECTION_STATUS } from '../constants/constants';
import { Device, DeviceInfo } from '../constants/interfaces';

// -------------------------------------------------------------------------
// Actions

export const DeviceActions = {
  // TODO: write type for devices
  ConnectToDevice: createAction<Device>('CONNECT_TO_DEVICE'),
  DisconnectFromDevice: createAction<void, 'EXPERIMENT_CLEANUP'>(
    'EXPERIMENT_CLEANUP'
  ),
  SetConnectionStatus: createAction<CONNECTION_STATUS, 'SET_CONNECTION_STATUS'>(
    'SET_CONNECTION_STATUS'
  ),
  SetDeviceAvailability: createAction<
    DEVICE_AVAILABILITY,
    'SET_DEVICE_AVAILABILITY'
  >('SET_DEVICE_AVAILABILITY'),

  // Actions From Epics
  SetDeviceInfo: createAction<DeviceInfo, 'SET_DEVICE_INFO'>('SET_DEVICE_INFO'),
  SetAvailableDevices: createAction<Device[], 'SET_AVAILABLE_DEVICES'>(
    'SET_AVAILABLE_DEVICES'
  ),
  DeviceFound: createAction<Device[], 'DEVICE_FOUND'>('DEVICE_FOUND'),
  SetDeviceType: createAction<string, 'SET_DEVICE_TYPE'>('SET_DEVICE_TYPE'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetRawObservable: createAction<any, 'SET_RAW_OBSERVABLE'>(
    // RxJS Observable from BLE device — no stable generic type available
    'SET_RAW_OBSERVABLE'
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetSignalQualityObservable: createAction<any, 'SET_SIGNAL_OBSERVABLE'>(
    // RxJS Observable from BLE device — no stable generic type available
    'SET_SIGNAL_OBSERVABLE'
  ),
  Cleanup: createAction<void, 'CLEANUP'>('CLEANUP'),
} as const;

export type DeviceActionType = ActionType<
  (typeof DeviceActions)[keyof typeof DeviceActions]
>;
