import { createReducer } from '@reduxjs/toolkit';
import { PyodideActions, ExperimentActions, EpochArraysMeta } from '../actions';

export interface PyodideStateType {
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
  readonly worker: Worker | null;
  readonly isWorkerReady: boolean;
}

const initialState: PyodideStateType = {
  epochsInfo: [],
  channelInfo: [],
  psdPlot: null,
  topoPlot: null,
  erpPlot: null,
  epochArrays: null,
  worker: null,
  isWorkerReady: false,
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
      };
    })
    .addCase(PyodideActions.SetTopoPlot, (state, action) => {
      return {
        ...state,
        topoPlot: action.payload,
      };
    })
    .addCase(PyodideActions.SetERPPlot, (state, action) => {
      return {
        ...state,
        erpPlot: action.payload,
      };
    })
    .addCase(PyodideActions.SetEpochArrays, (state, action) => {
      return { ...state, epochArrays: action.payload };
    })
    .addCase(PyodideActions.SetWorkerReady, (state) => {
      return { ...state, isWorkerReady: true };
    })
    .addCase(ExperimentActions.ExperimentCleanup, (state) => {
      return {
        ...state,
        epochsInfo: [],
        channelInfo: [],
        epochArrays: null,
        psdPlot: null,
        topoPlot: null,
        erpPlot: null,
      };
    })
);
