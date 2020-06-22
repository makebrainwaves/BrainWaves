// @flow
import {
  SET_KERNEL,
  SET_KERNEL_STATUS,
  SET_MAIN_CHANNEL,
  SET_KERNEL_INFO,
  SET_EPOCH_INFO,
  SET_CHANNEL_INFO,
  SET_PSD_PLOT,
  SET_TOPO_PLOT,
  SET_ERP_PLOT,
  RECEIVE_EXECUTE_RETURN
} from '../epics/jupyterEpics';
import { ActionType, Kernel } from '../constants/interfaces';
import { KERNEL_STATUS } from '../constants/constants';
import { EXPERIMENT_CLEANUP } from '../epics/experimentEpics';

export interface JupyterStateType {
  +kernel: ?Kernel;
  +kernelStatus: KERNEL_STATUS;
  +mainChannel: ?any;
  +epochsInfo: ?Array<{ [string]: number | string }>;
  +channelInfo: ?Array<string>;
  +psdPlot: ?{ [string]: string };
  +topoPlot: ?{ [string]: string };
  +erpPlot: ?{ [string]: string };
}

const initialState = {
  kernel: null,
  kernelStatus: KERNEL_STATUS.OFFLINE,
  mainChannel: null,
  epochsInfo: null,
  channelInfo: [],
  psdPlot: null,
  topoPlot: null,
  erpPlot: null
};

export default function jupyter(
  state: JupyterStateType = initialState,
  action: ActionType
) {
  switch (action.type) {
    case SET_KERNEL:
      return {
        ...state,
        kernel: action.payload
      };

    case SET_KERNEL_STATUS:
      return {
        ...state,
        kernelStatus: action.payload
      };

    case SET_MAIN_CHANNEL:
      return {
        ...state,
        mainChannel: action.payload
      };

    case SET_KERNEL_INFO:
      return state;

    case SET_EPOCH_INFO:
      return {
        ...state,
        epochsInfo: action.payload
      };

    case SET_CHANNEL_INFO:
      return {
        ...state,
        channelInfo: action.payload
      };

    case SET_PSD_PLOT:
      return {
        ...state,
        psdPlot: action.payload
      };

    case SET_TOPO_PLOT:
      return {
        ...state,
        topoPlot: action.payload
      };

    case SET_ERP_PLOT:
      return {
        ...state,
        erpPlot: action.payload
      };

    case EXPERIMENT_CLEANUP:
      return {
        ...state,
        epochsInfo: null,
        psdPlot: null,
        erpPlot: null
      };

    case RECEIVE_EXECUTE_RETURN:
      return state;

    default:
      return state;
  }
}
