import { createAction } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';
import { JUPYTER_VARIABLE_NAMES } from '../constants/constants';

// -------------------------------------------------------------------------
// Actions

export const JupyterActions = {
  LaunchKernel: createAction('LAUNCH_KERNEL'),
  RequestKernelInfo: createAction('REQUEST_KERNEL_INFO'),
  SendExecuteRequest: createAction<string, 'SEND_EXECUTE_REQUEST'>(
    'SEND_EXECUTE_REQUEST'
  ),
  LoadEpochs: createAction<object[], 'LOAD_EPOCHS'>('LOAD_EPOCHS'),
  LoadCleanedEpochs: createAction<string[], 'LOAD_CLEANED_EPOCHS'>(
    'LOAD_CLEANED_EPOCHS'
  ),
  LoadPSD: createAction('LOAD_PSD'),
  LoadERP: createAction<string, 'LOAD_ERP'>('LOAD_ERP'),
  LoadTopo: createAction('LOAD_TOPO'),
  CleanEpochs: createAction('CLEAN_EPOCHS'),
  CloseKernel: createAction('CLOSE_KERNEL'),
  SetKernel: createAction<any, 'SET_KERNEL'>('SET_KERNEL'),
  GetEpochsInfo: createAction<JUPYTER_VARIABLE_NAMES, 'GET_EPOCHS_INFO'>(
    'GET_EPOCHS_INFO'
  ),
  GetChannelInfo: createAction('GET_CHANNEL_INFO'),
  SetKernelStatus: createAction<any, 'SET_KERNEL_STATUS'>('SET_KERNEL_STATUS'),
  SetKernelInfo: createAction<any, 'SET_KERNEL_INFO'>('SET_KERNEL_INFO'),
  SetMainChannel: createAction<any, 'SET_MAIN_CHANNEL'>('SET_MAIN_CHANNEL'),
  SetEpochInfo: createAction<any, 'SET_EPOCH_INFO'>('SET_EPOCH_INFO'),
  SetChannelInfo: createAction<any, 'SET_CHANNEL_INFO'>('SET_CHANNEL_INFO'),
  SetPSDPlot: createAction<any, 'SET_PSD_PLOT'>('SET_PSD_PLOT'),
  SetTopoPlot: createAction<any, 'SET_TOPO_PLOT'>('SET_TOPO_PLOT'),
  SetERPPlot: createAction<any, 'SET_ERP_PLOT'>('SET_ERP_PLOT'),
  ReceiveExecuteReply: createAction<any, 'RECEIVE_EXECUTE_REPLY'>(
    'RECEIVE_EXECUTE_REPLY'
  ),
  ReceiveExecuteResult: createAction<any, 'RECEIVE_EXECUTE_RESULT'>(
    'RECEIVE_EXECUTE_RESULT'
  ),
  ReceiveDisplayData: createAction<any, 'RECEIVE_DISPLAY_DATA'>(
    'RECEIVE_DISPLAY_DATA'
  ),
  ReceiveStream: createAction<any, 'RECEIVE_STREAM'>('RECEIVE_STREAM'),
} as const;

export type JupyterActionType = ActionType<
  typeof JupyterActions[keyof typeof JupyterActions]
>;
