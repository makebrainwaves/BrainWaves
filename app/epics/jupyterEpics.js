import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import {
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
  filter,
  take,
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
  LOAD_ERP,
  CLOSE_KERNEL
} from "../actions/jupyterActions";
import {
  imports,
  utils,
  loadCSV,
  filterIIR,
  epochEvents,
  plotPSD,
  plotERP
} from "../utils/jupyter/cells";

import {
  EMOTIV_CHANNELS,
  EVENTS,
  DEVICES,
  MUSE_CHANNELS
} from "../constants/constants";
import { parseSingleQuoteJSON } from "../utils/jupyter/functions";

export const SET_KERNEL = "SET_KERNEL";
export const SET_KERNEL_INFO = "SET_KERNEL_INFO";
export const SET_MAIN_CHANNEL = "SET_MAIN_CHANNEL";
export const SET_EPOCH_INFO = "SET_EPOCH_INFO";
export const SET_PSD_PLOT = "SET_PSD_PLOT";
export const SET_ERP_PLOT = "SET_ERP_PLOT";
export const RECEIVE_EXECUTE_REPLY = "RECEIVE_EXECUTE_REPLY";
export const RECEIVE_EXECUTE_RESULT = "RECEIVE_EXECUTE_RESULT";
export const RECEIVE_STREAM = "RECEIVE_STREAM";
export const RECEIVE_DISPLAY_DATA = "RECEIVE_DISPLAY_DATA";

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

const setPSDPlot = payload => ({
  payload,
  type: SET_PSD_PLOT
});

const setERPPlot = payload => ({
  payload,
  type: SET_ERP_PLOT
});

const receiveExecuteReply = payload => ({
  payload,
  type: RECEIVE_EXECUTE_REPLY
});

const receiveExecuteResult = payload => ({
  payload,
  type: RECEIVE_EXECUTE_RESULT
});

const receiveDisplayData = payload => ({
  payload,
  type: RECEIVE_DISPLAY_DATA
});

const receiveStream = payload => ({
  payload,
  type: RECEIVE_STREAM
});

// -------------------------------------------------------------------------
// Epics

const launchEpic = action$ =>
  action$.ofType(LAUNCH_KERNEL).pipe(
    tap(() => console.log("launchEpic")),
    mergeMap(() => Observable.from(find("brainwaves"))),
    tap(info => console.log("kernelInfo: ", info)),
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
    tap(() => console.log("setting kernel")),
    map(setKernel)
  );

const setUpChannelEpic = action$ =>
  action$.ofType(SET_KERNEL).pipe(
    pluck("payload"),
    mergeMap(kernel => Observable.from(createMainChannel(kernel.config))),
    tap(mainChannel => mainChannel.next(executeRequest(imports()))),
    tap(mainChannel => mainChannel.next(executeRequest(utils()))),
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
              return receiveStream(msg);
            case "execute_reply":
              return receiveExecuteReply(msg);
            case "execute_result":
              return receiveExecuteResult(msg);
            case "display_data":
              return receiveDisplayData(msg);
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
    filter(filePathsArray => filePathsArray.length >= 1),
    map(filePathArray =>
      store
        .getState()
        .jupyter.mainChannel.next(
          executeRequest(
            loadCSV(filePathArray, store.getState().device.deviceType)
          )
        )
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_REPLY).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "shell" && msg.content.status === "ok"),
        take(1)
      )
    ),
    map(() =>
      store
        .getState()
        .jupyter.mainChannel.next(executeRequest(filterIIR(1, 30)))
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_REPLY).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "shell" && msg.content.status === "ok"),
        take(1)
      )
    ),
    map(() =>
      store
        .getState()
        .jupyter.mainChannel.next(
          executeRequest(
            epochEvents({ House: EVENTS.HOUSE, Face: EVENTS.FACE }, -0.1, 0.8)
          )
        )
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_RESULT).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "iopub" && !isNil(msg.content.data)),
        pluck("content", "data", "text/plain"),
        take(1)
      )
    ),
    tap(info => console.log("settingEpochInfo: ", info)),
    map(epochInfoString => setEpochInfo(parseSingleQuoteJSON(epochInfoString)))
  );

const loadPSDEpic = (action$, store) =>
  action$.ofType(SET_EPOCH_INFO).pipe(
    map(() =>
      store.getState().jupyter.mainChannel.next(executeRequest(plotPSD()))
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_DISPLAY_DATA).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "iopub" && !isNil(msg.content.data)),
        pluck("content", "data"),
        take(1)
      )
    ),
    tap(psd => console.log("setting PSD Plot: ", psd)),
    map(setPSDPlot)
  );

// NOTE: Will auto load when detecting a SET_PSD_PLOT action. check is to pick default channel in that case
const loadERPEpic = (action$, store) =>
  action$.ofType(LOAD_ERP, SET_PSD_PLOT).pipe(
    pluck("payload"),
    map(channelName => {
      console.log("channelName: ", channelName);
      const channels =
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS
          : MUSE_CHANNELS;
      if (channels.includes(channelName)) {
        return channels.indexOf(channelName);
      }
      return 0;
    }),
    map(channelIndex =>
      store
        .getState()
        .jupyter.mainChannel.next(executeRequest(plotERP(channelIndex)))
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_DISPLAY_DATA).pipe(
        pluck("payload"),
        tap(msg => console.log("receive in merge: ", msg)),
        filter(msg => msg.header.msg_type === "display_data"),
        pluck("content", "data"),
        take(1)
      )
    ),
    map(setERPPlot)
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
  loadPSDEpic,
  loadERPEpic,
  closeKernelEpic
);
