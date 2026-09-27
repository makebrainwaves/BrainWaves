import { createReducer } from '@reduxjs/toolkit';
import {
  PyodideActions,
  ExperimentActions,
  EpochArraysMeta,
  SuggestedRejection,
} from '../actions';

export interface PyodideStateType {
  // ponytail: shared with Clean; a Clean re-fetch in flight during Save &
  // analyze can land first (Analyze's own reply lands last, FIFO). Give
  // Analyze its own slot if that flash matters.
  readonly epochsInfo: Array<{
    [key: string]: number | string;
  }>;
  readonly channelInfo: string[];
  readonly psdPlot:
    | {
        [key: string]: string;
      }
    | null
    | undefined;
  readonly topoPlot:
    | {
        [key: string]: string;
      }
    | null
    | undefined;
  readonly erpPlot:
    | {
        [key: string]: string;
      }
    | null
    | undefined;
  readonly epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  // Analyze's cleaned epochs (`clean_epochs`), kept apart from Clean's raw slot.
  readonly cleanedEpochArrays: {
    buffer: ArrayBuffer;
    meta: EpochArraysMeta;
  } | null;
  // Plot keys ('psd' | 'topo' | 'erp') whose last request raised in Python.
  readonly failedPlots: string[];
  readonly suggestedRejections: SuggestedRejection[];
  readonly worker: Worker | null;
  readonly isWorkerReady: boolean;
  // Bumped every time a cleaned-epochs write settles. `revision` is what
  // consumers compare against; `ok` says whether the file made it to disk.
  readonly cleanedEpochsSave: {
    readonly revision: number;
    readonly ok: boolean;
  };
}

const initialState: PyodideStateType = {
  epochsInfo: [],
  channelInfo: [],
  psdPlot: null,
  topoPlot: null,
  erpPlot: null,
  epochArrays: null,
  cleanedEpochArrays: null,
  failedPlots: [],
  suggestedRejections: [],
  worker: null,
  isWorkerReady: false,
  cleanedEpochsSave: { revision: 0, ok: false },
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(PyodideActions.SetPyodideWorker, (state, action) => {
      return {
        ...state,
        worker: action.payload,
      };
    })
    .addCase(PyodideActions.SetEpochInfo, (state, action) => {
      return {
        ...state,
        epochsInfo: action.payload,
      };
    })
    .addCase(PyodideActions.SetChannelInfo, (state, action) => {
      return {
        ...state,
        channelInfo: action.payload,
      };
    })
    .addCase(PyodideActions.SetPSDPlot, (state, action) => {
      return {
        ...state,
        psdPlot: action.payload,
        failedPlots: state.failedPlots.filter((key) => key !== 'psd'),
      };
    })
    .addCase(PyodideActions.SetTopoPlot, (state, action) => {
      return {
        ...state,
        topoPlot: action.payload,
        failedPlots: state.failedPlots.filter((key) => key !== 'topo'),
      };
    })
    .addCase(PyodideActions.SetERPPlot, (state, action) => {
      return {
        ...state,
        erpPlot: action.payload,
        failedPlots: state.failedPlots.filter((key) => key !== 'erp'),
      };
    })
    .addCase(PyodideActions.SetEpochArrays, (state, action) => {
      // New epoch arrays → any prior auto-flag suggestions are stale.
      return { ...state, epochArrays: action.payload, suggestedRejections: [] };
    })
    .addCase(PyodideActions.SetCleanedEpochArrays, (state, action) => ({
      ...state,
      cleanedEpochArrays: action.payload,
    }))
    .addCase(PyodideActions.PlotFailed, (state, action) => ({
      ...state,
      failedPlots: [
        ...state.failedPlots.filter((key) => key !== action.payload),
        action.payload,
      ],
    }))
    .addCase(PyodideActions.LoadCleanedEpochs, (state) => ({
      ...state,
      psdPlot: null,
      topoPlot: null,
      erpPlot: null,
      epochsInfo: [],
      cleanedEpochArrays: null,
      failedPlots: [],
    }))
    .addCase(PyodideActions.LoadERP, (state) => ({
      ...state,
      erpPlot: null,
      failedPlots: state.failedPlots.filter((key) => key !== 'erp'),
    }))
    .addCase(PyodideActions.SetSuggestedRejections, (state, action) => ({
      ...state,
      suggestedRejections: action.payload,
    }))
    .addCase(PyodideActions.SetWorkerReady, (state) => {
      return { ...state, isWorkerReady: true };
    })
    .addCase(PyodideActions.CleanedEpochsSaveSettled, (state, action) => ({
      ...state,
      cleanedEpochsSave: {
        revision: state.cleanedEpochsSave.revision + 1,
        ok: action.payload.ok,
      },
    }))
    .addCase(ExperimentActions.ExperimentCleanup, (state) => {
      return {
        ...state,
        epochsInfo: [],
        channelInfo: [],
        epochArrays: null,
        cleanedEpochArrays: null,
        failedPlots: [],
        suggestedRejections: [],
        psdPlot: null,
        topoPlot: null,
        erpPlot: null,
      };
    })
);
