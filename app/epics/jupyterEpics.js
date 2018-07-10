import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import {
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
  filter
} from "rxjs/operators";
import { find } from "kernelspecs";
import { launchSpec } from "spawnteract";
import { createMainChannel } from "enchannel-zmq-backend";
import { isNil } from "lodash";
import { kernelInfoRequest, executeRequest } from "@nteract/messaging";
import {
  LAUNCH_KERNEL,
  REQUEST_KERNEL_INFO,
  SEND_EXECUTE_REQUEST,
  CLOSE_KERNEL
} from "../actions/jupyterActions";

export const SET_KERNEL = "SET_KERNEL";
export const SET_KERNEL_INFO = "SET_KERNEL_INFO";
export const SET_MAIN_CHANNEL = "SET_MAIN_CHANNEL";
export const RECEIVE_EXECUTE_RETURN = "RECEIVE_EXECUTE_REQUEST";

// -------------------------------------------------------------------------
// Action Creators

const setKernel = payload => ({
  payload,
  type: SET_KERNEL
});

const setKernelInfo = payload => ({
  payload,
  type: SET_KERNEL_INFO
});

const setMainChannel = payload => ({
  payload,
  type: SET_MAIN_CHANNEL
});

const receiveExecuteReturn = payload => ({
  payload,
  type: RECEIVE_EXECUTE_RETURN
});

// -------------------------------------------------------------------------
// Epics

const launchEpic = action$ =>
  action$.ofType(LAUNCH_KERNEL).pipe(
    mergeMap(() => Observable.from(find("python3"))),
    tap(console.log),
    mergeMap(kernelInfo =>
      Observable.from(
        launchSpec(kernelInfo.spec, {
          // No STDIN, opt in to STDOUT and STDERR as node streams
          stdio: ["ignore", "pipe", "pipe"]
        })
      )
    ),
    tap(kernel => {
      // Route everything that we won't get in messages to our own stdout
      kernel.spawn.stdout.on("data", data => {
        const text = data.toString();
        console.log("KERNEL STDOUT: ", text);
      });
      kernel.spawn.stderr.on("data", data => {
        const text = data.toString();
        console.log("KERNEL STDERR: ", text);
      });

      kernel.spawn.on("close", () => {
        console.log("closed early");
      });
    }),
    map(setKernel)
  );

const setUpChannelEpic = action$ =>
  action$.ofType(SET_KERNEL).pipe(
    pluck("payload"),
    mergeMap(kernel => Observable.from(createMainChannel(kernel.config))),
    map(setMainChannel)
  );

const requestKernelInfoEpic = (action$, store) =>
  action$.ofType(REQUEST_KERNEL_INFO).pipe(
    filter(() => store.getState().jupyter.mainChannel),
    map(() => store.getState().jupyter.mainChannel.next(kernelInfoRequest())),
    ignoreElements()
  );

const sendExecuteRequestEpic = (action$, store) =>
  action$.ofType(SEND_EXECUTE_REQUEST).pipe(
    pluck("payload"),
    map(command =>
      store.getState().jupyter.mainChannel.next(executeRequest(command))
    ),
    ignoreElements()
  );

const receiveChannelMessageEpic = (action$, store) =>
  action$.ofType(SET_MAIN_CHANNEL).pipe(
    mergeMap(() =>
      store.getState().jupyter.mainChannel.pipe(
        map(msg => {
          switch (msg["header"]["msg_type"]) {
            case "kernel_info_reply":
              return setKernelInfo(msg);
            case "stream":
              return receiveExecuteReturn(msg);
            default:
          }
        }),
        filter(action => !isNil(action))
      )
    )
  );

const closeKernelEpic = (action$, store) =>
  action$.ofType(CLOSE_KERNEL).pipe(
    map(() => {
      store.getState().jupyter.kernel.spawn.kill();
      store.getState().jupyter.mainChannel.complete();
    }),
    ignoreElements()
  );

export default combineEpics(
  launchEpic,
  setUpChannelEpic,
  requestKernelInfoEpic,
  sendExecuteRequestEpic,
  receiveChannelMessageEpic,
  closeKernelEpic
);
