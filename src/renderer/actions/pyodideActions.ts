import { createAction } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';
import { PYODIDE_VARIABLE_NAMES } from '../constants/constants';

// Metadata shipped alongside the raw epoch buffer (dataKey 'epochArrays').
export interface EpochArraysMeta {
  n_epochs: number;
  n_channels: number;
  n_times: number;
  ch_names: string[];
  times: number[];
  event_codes: number[];
}

/** One `get_epochs_info` row as pyodideMessageEpic flattens it, e.g. `{ name: 'Face', value: 40 }`. */
export interface EpochInfoRow {
  name: string;
  value: number | string;
}

// Auto-flag: a single artifact suggestion returned by Python's
// suggest_rejections(epochs, threshold_uv) — one epoch/channel over threshold.
export interface SuggestedRejection {
  index: number;
  reason: string;
}

// Outcome of writing the cleaned .fif to the workspace. The write is the last
// step of a clean, and Analyze lists that directory on mount, so screens that
// need the file on disk wait for this before navigating.

// -------------------------------------------------------------------------
// Actions

export const PyodideActions = {
  Launch: createAction('LAUNCH'),
  SetPyodideWorker: createAction<Worker, 'SET_PYODIDE_WORKER'>(
    'SET_PYODIDE_WORKER'
  ),
  /** One raw recording path: a flagged sensor belongs to one recording. */
  LoadEpochs: createAction<string, 'LOAD_EPOCHS'>('LOAD_EPOCHS'),
  LoadCleanedEpochs: createAction<string[], 'LOAD_CLEANED_EPOCHS'>(
    'LOAD_CLEANED_EPOCHS'
  ),
  LoadPSD: createAction('LOAD_PSD'),
  LoadERP: createAction<string, 'LOAD_ERP'>('LOAD_ERP'),
  LoadTopo: createAction('LOAD_TOPO'),
  CleanEpochs: createAction<
    { dropIndices: number[]; badChannels: string[] },
    'CLEAN_EPOCHS'
  >('CLEAN_EPOCHS'),
  GetEpochsInfo: createAction<PYODIDE_VARIABLE_NAMES, 'GET_EPOCHS_INFO'>(
    'GET_EPOCHS_INFO'
  ),
  GetChannelInfo: createAction('GET_CHANNEL_INFO'),
  SetEpochInfo: createAction<EpochInfoRow[], 'SET_EPOCH_INFO'>(
    'SET_EPOCH_INFO'
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetChannelInfo: createAction<any, 'SET_CHANNEL_INFO'>('SET_CHANNEL_INFO'), // Pyodide WASM runtime result — shape is dynamic
  SetEpochArrays: createAction<
    { buffer: ArrayBuffer; meta: EpochArraysMeta },
    'SET_EPOCH_ARRAYS'
  >('SET_EPOCH_ARRAYS'),
  SetCleanedEpochArrays: createAction<
    { buffer: ArrayBuffer; meta: EpochArraysMeta },
    'SET_CLEANED_EPOCH_ARRAYS'
  >('SET_CLEANED_EPOCH_ARRAYS'),
  // A worker plot request raised in Python; the key is the plot that failed.
  PlotFailed: createAction<'psd' | 'topo' | 'erp', 'PLOT_FAILED'>(
    'PLOT_FAILED'
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetPSDPlot: createAction<any, 'SET_PSD_PLOT'>('SET_PSD_PLOT'), // Pyodide WASM runtime result — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetTopoPlot: createAction<any, 'SET_TOPO_PLOT'>('SET_TOPO_PLOT'), // Pyodide WASM runtime result — shape is dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetERPPlot: createAction<any, 'SET_ERP_PLOT'>('SET_ERP_PLOT'), // Pyodide WASM runtime result — shape is dynamic

  SetWorkerReady: createAction('SET_WORKER_READY'),
  GetSuggestedRejections: createAction<number, 'GET_SUGGESTED_REJECTIONS'>(
    'GET_SUGGESTED_REJECTIONS'
  ),
  SetSuggestedRejections: createAction<
    SuggestedRejection[],
    'SET_SUGGESTED_REJECTIONS'
  >('SET_SUGGESTED_REJECTIONS'),
  CleanedEpochsSaveSettled: createAction<
    { ok: boolean },
    'CLEANED_EPOCHS_SAVE_SETTLED'
  >('CLEANED_EPOCHS_SAVE_SETTLED'),
} as const;

export type PyodideActionType = ActionType<
  (typeof PyodideActions)[keyof typeof PyodideActions]
>;
