import { combineEpics } from "redux-observable";
import { from } from "rxjs";
import {
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
  filter,
  take
} from "rxjs/operators";
import { find } from "kernelspecs";
import { launchSpec } from "spawnteract";
import { createMainChannel } from "enchannel-zmq-backend";
import { isNil } from "lodash";
import { kernelInfoRequest, executeRequest } from "@nteract/messaging";
import { execute, awaitOkMessage } from "../utils/jupyter/pipes";
import {
  LAUNCH_KERNEL,
  REQUEST_KERNEL_INFO,
  LOAD_EPOCHS,
  LOAD_PSD,
  LOAD_ERP,
  CLEAN_EPOCHS,
  CLOSE_KERNEL
} from "../actions/jupyterActions";
import {
  imports,
  utils,
  loadCSV,
  filterIIR,
  epochEvents,
  requestEpochsInfo,
  cleanEpochsPlot,
  plotPSD,
  plotERP
} from "../utils/jupyter/cells";

import {
  EMOTIV_CHANNELS,
  EVENTS,
  DEVICES,
  MUSE_CHANNELS
} from "../constants/constants";
import {
  parseSingleQuoteJSON,
  parseKernelStatus,
  debugParseMessage
} from "../utils/jupyter/functions";

export const GET_EPOCHS_INFO = "GET_EPOCHS_INFO";
export const SET_KERNEL = "SET_KERNEL";
export const SET_KERNEL_STATUS = "SET_KERNEL_STATUS";
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

const getEpochsInfo = () => ({ type: GET_EPOCHS_INFO });

const setKernel = payload => ({
  payload,
  type: SET_KERNEL
});

const setKernelStatus = payload => ({
  payload,
  type: SET_KERNEL_STATUS
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
    mergeMap(() => from(find("brainwaves"))),
    mergeMap(kernelInfo =>
      from(
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
    mergeMap(kernel => from(createMainChannel(kernel.config))),
    tap(mainChannel => mainChannel.next(executeRequest(imports()))),
    tap(mainChannel => mainChannel.next(executeRequest(utils()))),
    map(setMainChannel)
  );

const receiveChannelMessageEpic = (action$, state$) =>
  action$.ofType(SET_MAIN_CHANNEL).pipe(
    mergeMap(() =>
      state$.value.jupyter.mainChannel.pipe(
        map(msg => {
          console.log(debugParseMessage(msg));
          switch (msg["header"]["msg_type"]) {
            case "kernel_info_reply":
              return setKernelInfo(msg);
            case "status":
              return setKernelStatus(parseKernelStatus(msg));
            case "stream":
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

const requestKernelInfoEpic = (action$, state$) =>
  action$.ofType(REQUEST_KERNEL_INFO).pipe(
    filter(() => state$.value.jupyter.mainChannel),
    map(() => state$.value.jupyter.mainChannel.next(kernelInfoRequest())),
    ignoreElements()
  );

const loadEpochsEpic = (action$, state$) =>
  action$.ofType(LOAD_EPOCHS).pipe(
    pluck("payload"),
    filter(filePathsArray => filePathsArray.length >= 1),
    map(filePathsArray =>
      state$.value.jupyter.mainChannel.next(
        executeRequest(loadCSV(filePathsArray, state$.value.device.deviceType))
      )
    ),
    awaitOkMessage(action$),
    execute(filterIIR(1, 30), state$),
    awaitOkMessage(action$),
    execute(
      epochEvents({ House: EVENTS.HOUSE, Face: EVENTS.FACE }, -0.1, 0.8),
      state$
    ),
    awaitOkMessage(action$),
    map(getEpochsInfo)
  );

const cleanEpochsEpic = (action$, state$) =>
  action$.ofType(CLEAN_EPOCHS).pipe(
    execute(cleanEpochsPlot(), state$),
    mergeMap(() =>
      action$.ofType(RECEIVE_STREAM).pipe(
        pluck("payload"),
        filter(
          msg =>
            msg.channel === "iopub" &&
            msg.content.text.includes("Channels marked as bad")
        ),
        take(1)
      )
    ),
    map(getEpochsInfo)
  );

const getEpochsInfoEpic = (action$, state$) =>
  action$.ofType(GET_EPOCHS_INFO).pipe(
    execute(requestEpochsInfo(), state$),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_RESULT).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "iopub" && !isNil(msg.content.data)),
        pluck("content", "data", "text/plain"),
        take(1)
      )
    ),
    map(epochInfoString => setEpochInfo(parseSingleQuoteJSON(epochInfoString)))
  );

const loadPSDEpic = (action$, state$) =>
  action$.ofType(LOAD_PSD).pipe(
    execute(plotPSD(), state$),
    mergeMap(() =>
      action$.ofType(RECEIVE_DISPLAY_DATA).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "iopub" && !isNil(msg.content.data)),
        pluck("content", "data"),
        take(1)
      )
    ),
    map(setPSDPlot)
  );

const loadERPEpic = (action$, state$) =>
  action$.ofType(LOAD_ERP).pipe(
    pluck("payload"),
    map(channelName => {
      const channels =
        state$.value.device.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS
          : MUSE_CHANNELS;
      if (channels.includes(channelName)) {
        return channels.indexOf(channelName);
      }
      return 0;
    }),
    map(channelIndex =>
      state$
        .getState()
        .jupyter.mainChannel.next(executeRequest(plotERP(channelIndex)))
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_DISPLAY_DATA).pipe(
        pluck("payload"),
        filter(msg => msg.header.msg_type === "display_data"),
        pluck("content", "data"),
        take(1)
      )
    ),
    map(setERPPlot)
  );

const closeKernelEpic = (action$, state$) =>
  action$.ofType(CLOSE_KERNEL).pipe(
    map(() => {
      state$.value.jupyter.kernel.spawn.kill();
      state$.value.jupyter.mainChannel.complete();
    }),
    ignoreElements()
  );

export default combineEpics(
  launchEpic,
  setUpChannelEpic,
  requestKernelInfoEpic,
  receiveChannelMessageEpic,
  loadEpochsEpic,
  cleanEpochsEpic,
  getEpochsInfoEpic,
  loadPSDEpic,
  loadERPEpic,
  closeKernelEpic
);
