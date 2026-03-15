import { createAction } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';
import { PYODIDE_VARIABLE_NAMES } from '../constants/constants';

// -------------------------------------------------------------------------
// Actions

export const PyodideActions = {
  Launch: createAction('LAUNCH'),
  SetPyodideWorker: createAction<Worker, 'SET_PYODIDE_WORKER'>(
    'SET_PYODIDE_WORKER'
  ),
  LoadEpochs: createAction<string[], 'LOAD_EPOCHS'>('LOAD_EPOCHS'),
  LoadCleanedEpochs: createAction<string[], 'LOAD_CLEANED_EPOCHS'>(
    'LOAD_CLEANED_EPOCHS'
  ),
  LoadPSD: createAction('LOAD_PSD'),
  LoadERP: createAction<string, 'LOAD_ERP'>('LOAD_ERP'),
  LoadTopo: createAction('LOAD_TOPO'),
  CleanEpochs: createAction('CLEAN_EPOCHS'),
  GetEpochsInfo: createAction<PYODIDE_VARIABLE_NAMES, 'GET_EPOCHS_INFO'>(
    'GET_EPOCHS_INFO'
  ),
  GetChannelInfo: createAction('GET_CHANNEL_INFO'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetEpochInfo: createAction<any, 'SET_EPOCH_INFO'>('SET_EPOCH_INFO'), // Pyodide WASM runtime result — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetChannelInfo: createAction<any, 'SET_CHANNEL_INFO'>('SET_CHANNEL_INFO'), // Pyodide WASM runtime result — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetPSDPlot: createAction<any, 'SET_PSD_PLOT'>('SET_PSD_PLOT'), // Pyodide WASM runtime result — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetTopoPlot: createAction<any, 'SET_TOPO_PLOT'>('SET_TOPO_PLOT'), // Pyodide WASM runtime result — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetERPPlot: createAction<any, 'SET_ERP_PLOT'>('SET_ERP_PLOT'), // Pyodide WASM runtime result — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReceiveMessage: createAction<any, 'RECEIVE_MESSAGE'>('RECEIVE_MESSAGE'), // Worker message event — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReceiveError: createAction<any, 'RECEIVE_ERROR'>('RECEIVE_ERROR'), // Worker error event — shape is dynamic
  SetWorkerReady: createAction('SET_WORKER_READY'),
} as const;

export type PyodideActionType = ActionType<
  (typeof PyodideActions)[keyof typeof PyodideActions]
>;
