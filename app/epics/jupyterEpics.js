import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import {
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
  filter,
  toArray,
  take
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
  LOAD_EPOCHS,
  CLOSE_KERNEL
} from "../actions/jupyterActions";
import {
  imports,
  loadCSV,
  filterIIR,
  epochEvents
} from "../utils/jupyter/cells";
import { EMOTIV_CHANNELS } from "../constants/constants";
import { exec } from "child_process";

export const SET_KERNEL = "SET_KERNEL";
export const SET_KERNEL_INFO = "SET_KERNEL_INFO";
export const SET_MAIN_CHANNEL = "SET_MAIN_CHANNEL";
export const SET_EPOCH_INFO = "SET_EPOCH_INFO";
export const SET_PSD_PLOT = "SET_PSD_PLOT";
export const SET_ERP_PLOT = "SET_ERP_PLOT";
export const RECEIVE_EXECUTE_RETURN = "RECEIVE_EXECUTE_RETURN";

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

const setEpochInfo = payload => ({
  payload,
  type: SET_EPOCH_INFO
});

const receiveExecuteReturn = payload => ({
  payload,
  type: RECEIVE_EXECUTE_RETURN
});

// -------------------------------------------------------------------------
// Epics

const launchEpic = action$ =>
  action$.ofType(LAUNCH_KERNEL).pipe(
    mergeMap(() => Observable.from(find("brainwaves"))),
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
        console.log("Kernel closed");
      });
    }),
    map(setKernel)
  );

const setUpChannelEpic = action$ =>
  action$.ofType(SET_KERNEL).pipe(
    pluck("payload"),
    mergeMap(kernel => Observable.from(createMainChannel(kernel.config))),
    tap(mainChannel => mainChannel.next(executeRequest(imports()))),
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
          console.log(msg);
          switch (msg["header"]["msg_type"]) {
            case "kernel_info_reply":
              return setKernelInfo(msg);
            case "stream":
              // OTDO: Change to another action?
              return receiveExecuteReturn(msg);
            case "execute_reply":
              return receiveExecuteReturn(msg);
            default:
          }
        }),
        filter(action => !isNil(action))
      )
    )
  );

const loadEpochsEpic = (action$, store) =>
  action$.ofType(LOAD_EPOCHS).pipe(
    pluck("payload"),
    tap(console.log),
    map(filePathArray =>
      store
        .getState()
        .jupyter.mainChannel.next(
          executeRequest(
            loadCSV(
              filePathArray,
              128.0,
              EMOTIV_CHANNELS.map((_, i) => i),
              EMOTIV_CHANNELS.length
            )
          )
        )
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_RETURN).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "shell" && msg.content.status === "ok"),
        tap(() => console.log("received OK from load")),
        take(1)
      )
    ),
    map(() =>
      store
        .getState()
        .jupyter.mainChannel.next(executeRequest(filterIIR(1, 30)))
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_RETURN).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "shell" && msg.content.status === "ok"),
        tap(() => console.log("received OK from filter")),
        take(1)
      )
    ),
    map(() =>
      store
        .getState()
        .jupyter.mainChannel.next(
          executeRequest(epochEvents({ House: 3, Face: 4 }, -0.1, 0.8))
        )
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_RETURN).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "shell" && msg.content.status === "ok"),
        tap(() => console.log("received OK from epoch")),
        take(1)
      )
    ),
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
  loadEpochsEpic,
  closeKernelEpic
);
