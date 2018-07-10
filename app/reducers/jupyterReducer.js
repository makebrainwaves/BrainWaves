// @flow
import {
  SET_KERNEL,
  SET_MAIN_CHANNEL,
  SET_KERNEL_INFO,
  RECEIVE_EXECUTE_RETURN
} from "../epics/jupyterEpics";
import { ActionType, Kernel } from "../constants/interfaces";

export interface JupyterStateType {
  kernel: ?Kernel;
  mainChannel: ?any;
}

const initialState = {
  kernel: null,
  mainChannel: null
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

    case SET_MAIN_CHANNEL:
      console.log(action.payload);
      return {
        ...state,
        mainChannel: action.payload
      };

    case SET_KERNEL_INFO:
      console.log(action.payload);
      return state;

    case RECEIVE_EXECUTE_RETURN:
      console.log(action.payload);
      return state;

    default:
      return state;
  }
}
