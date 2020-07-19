import { createReducer } from '@reduxjs/toolkit';
import { Kernel } from '../constants/interfaces';
import { KERNEL_STATUS } from '../constants/constants';
import { JupyterActions, ExperimentActions } from '../actions';

export interface JupyterStateType {
  readonly kernel: Kernel | null | undefined;
  readonly kernelStatus: KERNEL_STATUS;
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
  kernel: null,
  kernelStatus: KERNEL_STATUS.OFFLINE,
  mainChannel: null,
  epochsInfo: [],
  channelInfo: [],
  psdPlot: null,
  topoPlot: null,
  erpPlot: null
};

export default createReducer(initialState, builder =>
  builder
    .addCase(JupyterActions.SetKernel, (state, action) => {
      return {
        ...state,
        kernel: action.payload
      };
    })
    .addCase(JupyterActions.SetKernelStatus, (state, action) => {
      return {
        ...state,
        kernelStatus: action.payload
      };
    })
    .addCase(JupyterActions.SetMainChannel, (state, action) => {
      return {
        ...state,
        mainChannel: action.payload
      };
    })
    .addCase(JupyterActions.SetEpochInfo, (state, action) => {
      return {
        ...state,
        epochsInfo: action.payload
      };
    })
    .addCase(JupyterActions.SetChannelInfo, (state, action) => {
      return {
        ...state,
        channelInfo: action.payload
      };
    })
    .addCase(JupyterActions.SetPSDPlot, (state, action) => {
      return {
        ...state,
        psdPlot: action.payload
      };
    })
    .addCase(JupyterActions.SetTopoPlot, (state, action) => {
      return {
        ...state,
        topoPlot: action.payload
      };
    })
    .addCase(JupyterActions.SetERPPlot, (state, action) => {
      return {
        ...state,
        erpPlot: action.payload
      };
    })
    .addCase(ExperimentActions.ExperimentCleanup, (state, action) => {
      return {
        ...state,
        epochsInfo: [],
        psdPlot: null,
        erpPlot: null
      };
    })
);
