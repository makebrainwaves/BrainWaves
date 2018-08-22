// @flow
import {
  SET_KERNEL,
  SET_KERNEL_STATUS,
  SET_MAIN_CHANNEL,
  SET_KERNEL_INFO,
  SET_EPOCH_INFO,
  SET_PSD_PLOT,
  SET_ERP_PLOT,
  RECEIVE_EXECUTE_RETURN
} from "../epics/jupyterEpics";
import { ActionType, Kernel } from "../constants/interfaces";
import { KERNEL_STATUS } from "../constants/constants";

export interface JupyterStateType {
  +kernel: ?Kernel;
  +kernelStatus: KERNEL_STATUS;
  +mainChannel: ?any;
  +epochsInfo: ?{ [string]: number };
  +psdPlot: ?{ [string]: string };
  +erpPlot: ?{ [string]: string };
}

const initialState = {
  kernel: null,
  kernelStatus: KERNEL_STATUS.OFFLINE,
  mainChannel: null,
  epochsInfo: null,
  psdPlot: null,
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
      console.log(action.payload);
      return {
        ...state,
        mainChannel: action.payload
      };

    case SET_KERNEL_INFO:
      console.log(action.payload);
      return state;

    case SET_EPOCH_INFO:
      return {
        ...state,
        epochsInfo: action.payload
      };

    case SET_PSD_PLOT:
      return {
        ...state,
        psdPlot: action.payload
      };

    case SET_ERP_PLOT:
      return {
        ...state,
        erpPlot: action.payload
      };

    case RECEIVE_EXECUTE_RETURN:
      return state;

    default:
      return state;
  }
}
