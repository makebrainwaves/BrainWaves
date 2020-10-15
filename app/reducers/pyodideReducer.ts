import { createReducer } from '@reduxjs/toolkit';
import { PyodideActions, ExperimentActions } from '../actions';

export interface PyodideStateType {
  readonly mainChannel: any | null | undefined;
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
}

const initialState = {
  mainChannel: null,
  epochsInfo: [],
  channelInfo: [],
  psdPlot: null,
  topoPlot: null,
  erpPlot: null,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(PyodideActions.SetMainChannel, (state, action) => {
      return {
        ...state,
        mainChannel: action.payload,
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
    .addCase(ExperimentActions.ExperimentCleanup, (state, action) => {
      return {
        ...state,
        epochsInfo: [],
        psdPlot: null,
        erpPlot: null,
      };
    })
);
