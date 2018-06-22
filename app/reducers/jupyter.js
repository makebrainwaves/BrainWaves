// @flow
import {
  SET_KERNEL,
  SET_MAIN_CHANNEL,
  SET_KERNEL_INFO,
  RECEIVE_EXECUTE_RETURN
} from "../epics/jupyter";
import { ChildProcess } from "child_process";
import { Subject } from "rxjs";

export type jupyterStateType = {
  kernel: ?{
    config: Object,
    connectionFile: string,
    kernelSpec: Object,
    spawn: ChildProcess
  },
  mainChannel: ?Subject
};

type actionType = {
  +payload: any,
  +type: string
};

const initialState = {
  kernel: null,
  mainChannel: null
};

export default function jupyter(
  state: jupyterStateType = initialState,
  action: actionType
) {
  switch (action.type) {
    case SET_KERNEL:
      return {
        ...state,
        kernel: action.payload
      };

    case SET_MAIN_CHANNEL:
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
