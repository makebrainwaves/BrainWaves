// @flow
import {
  SET_MAIN_CHANNEL,
  SET_EPOCH_INFO,
  SET_CHANNEL_INFO,
  SET_PSD_PLOT,
  SET_TOPO_PLOT,
  SET_ERP_PLOT,
  RECEIVE_EXECUTE_RETURN,
  SET_PYODIDE_STATUS
} from "../epics/pyodideEpics";
import { ActionType } from "../constants/interfaces";
import { PYODIDE_STATUS } from "../constants/constants";
import { EXPERIMENT_CLEANUP } from "../epics/experimentEpics";

export interface PyodideStateType {
  +mainChannel: ?any;
  +epochsInfo: ?Array<{ [string]: number | string }>;
  +channelInfo: ?Array<string>;
  +psdPlot: ?{ [string]: string };
  +topoPlot: ?{ [string]: string };
  +erpPlot: ?{ [string]: string };
}

const initialState = {
  mainChannel: null,
  epochsInfo: null,
  channelInfo: [],
  psdPlot: null,
  topoPlot: null,
  erpPlot: null,
  status: PYODIDE_STATUS.NOT_LOADED
};

export default function pyodide(
  state: PyodideStateType = initialState,
  action: ActionType
) {
  switch (action.type) {
    case SET_MAIN_CHANNEL:
      return {
        ...state,
        mainChannel: action.payload,
      };

    case SET_EPOCH_INFO:
      return {
        ...state,
        epochsInfo: action.payload,
      };

    case SET_CHANNEL_INFO:
      return {
        ...state,
        channelInfo: action.payload,
      };

    case SET_PSD_PLOT:
      return {
        ...state,
        psdPlot: action.payload,
      };

    case SET_TOPO_PLOT:
      return {
        ...state,
        topoPlot: action.payload,
      };

    case SET_ERP_PLOT:
      return {
        ...state,
        erpPlot: action.payload,
      };

    case EXPERIMENT_CLEANUP:
      return {
        ...state,
        epochsInfo: null,
        psdPlot: null,
        erpPlot: null,
      };

    case RECEIVE_EXECUTE_RETURN:
      return state;

    case SET_PYODIDE_STATUS:
      return {
        ...state,
        status: action.payload
      };

    default:
      return state;
  }
}
