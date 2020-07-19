import { createAction } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';
import { DEVICE_AVAILABILITY } from '../constants/constants';
import { DeviceInfo } from '../constants/interfaces';

// -------------------------------------------------------------------------
// Actions

export const DeviceActions = {
  // TODO: write type for devices
  ConnectToDevice: createAction<any>('CONNECT_TO_DEVICE'),
  DisconnectFromDevice: createAction<any, 'EXPERIMENT_CLEANUP'>(
    'EXPERIMENT_CLEANUP'
  ),
  SetConnectionStatus: createAction<any, 'SET_CONNECTION_STATUS'>(
    'SET_CONNECTION_STATUS'
  ),
  SetDeviceAvailability: createAction<
    DEVICE_AVAILABILITY,
    'SET_DEVICE_AVAILABILITY'
  >('SET_DEVICE_AVAILABILITY'),

  // Actions From Epics
  SetDeviceInfo: createAction<DeviceInfo, 'SET_DEVICE_INFO'>('SET_DEVICE_INFO'),
  SetAvailableDevices: createAction<any[], 'SET_AVAILABLE_DEVICES'>(
    'SET_AVAILABLE_DEVICES'
  ),
  DeviceFound: createAction<any, 'DEVICE_FOUND'>('DEVICE_FOUND'),
  SetDeviceType: createAction<any, 'SET_DEVICE_TYPE'>('SET_DEVICE_TYPE'),
  SetRawObservable: createAction<any, 'SET_RAW_OBSERVABLE'>(
    'SET_RAW_OBSERVABLE'
  ),
  SetSignalQualityObservable: createAction<any, 'SET_SIGNAL_OBSERVABLE'>(
    'SET_SIGNAL_OBSERVABLE'
  ),
  Cleanup: createAction<any, 'CLEANUP'>('CLEANUP')
} as const;

export type DeviceActionType = ActionType<
  typeof DeviceActions[keyof typeof DeviceActions]
>;
