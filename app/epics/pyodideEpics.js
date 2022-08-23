import { combineEpics } from 'redux-observable';
import { from, of } from 'rxjs';
import {
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
  filter,
  take
} from 'rxjs/operators';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import { getWorkspaceDir } from '../utils/filesystem/storage';
import {
  LOAD_EPOCHS,
  LOAD_CLEANED_EPOCHS,
  LOAD_PSD,
  LOAD_ERP,
  LOAD_TOPO,
  CLEAN_EPOCHS,
  loadTopo,
  loadERP
} from '../actions/pyodideActions';
import {
  imports,
  utils,
  loadCSV,
  loadCleanedEpochs,
  filterIIR,
  epochEvents,
  requestEpochsInfo,
  requestChannelInfo,
  cleanEpochsPlot,
  plotPSD,
  plotERP,
  plotTopoMap,
  saveEpochs
} from '../utils/pyodide/commands';
import {
  EMOTIV_CHANNELS,
  EVENTS,
  DEVICES,
  MUSE_CHANNELS,
  PYODIDE_VARIABLE_NAMES
} from '../constants/constants';


export const GET_EPOCHS_INFO = 'GET_EPOCHS_INFO';
export const GET_CHANNEL_INFO = 'GET_CHANNEL_INFO';
export const SET_KERNEL = 'SET_KERNEL';
export const SET_KERNEL_STATUS = 'SET_KERNEL_STATUS';
export const SET_KERNEL_INFO = 'SET_KERNEL_INFO';
export const SET_MAIN_CHANNEL = 'SET_MAIN_CHANNEL';
export const SET_EPOCH_INFO = 'SET_EPOCH_INFO';
export const SET_CHANNEL_INFO = 'SET_CHANNEL_INFO';
export const SET_PSD_PLOT = 'SET_PSD_PLOT';
export const SET_ERP_PLOT = 'SET_ERP_PLOT';
export const SET_TOPO_PLOT = 'SET_TOPO_PLOT';
export const RECEIVE_EXECUTE_REPLY = 'RECEIVE_EXECUTE_REPLY';
export const RECEIVE_EXECUTE_RESULT = 'RECEIVE_EXECUTE_RESULT';
export const RECEIVE_STREAM = 'RECEIVE_STREAM';
export const RECEIVE_DISPLAY_DATA = 'RECEIVE_DISPLAY_DATA';

// -------------------------------------------------------------------------
// Action Creators

const getEpochsInfo = (payload) => ({ payload, type: GET_EPOCHS_INFO });

const getChannelInfo = () => ({ type: GET_CHANNEL_INFO });

const setKernel = (payload) => ({
  payload,
  type: SET_KERNEL,
});

const setKernelStatus = (payload) => ({
  payload,
  type: SET_KERNEL_STATUS,
});

const setKernelInfo = (payload) => ({
  payload,
  type: SET_KERNEL_INFO,
});

const setMainChannel = (payload) => ({
  payload,
  type: SET_MAIN_CHANNEL,
});

const setEpochInfo = (payload) => ({
  payload,
  type: SET_EPOCH_INFO,
});

const setChannelInfo = (payload) => ({
  payload,
  type: SET_CHANNEL_INFO,
});

const setPSDPlot = (payload) => ({
  payload,
  type: SET_PSD_PLOT,
});

const setTopoPlot = (payload) => ({
  payload,
  type: SET_TOPO_PLOT,
});

const setERPPlot = (payload) => ({
  payload,
  type: SET_ERP_PLOT,
});

const receiveExecuteReply = (payload) => ({
  payload,
  type: RECEIVE_EXECUTE_REPLY,
});

const receiveExecuteResult = (payload) => ({
  payload,
  type: RECEIVE_EXECUTE_RESULT,
});

const receiveDisplayData = (payload) => ({
  payload,
  type: RECEIVE_DISPLAY_DATA,
});

const receiveStream = (payload) => ({
  payload,
  type: RECEIVE_STREAM,
});

// -------------------------------------------------------------------------
// Epics

const loadEpochsEpic = (action$, state$) =>
  action$.ofType(LOAD_EPOCHS).pipe(
    pluck('payload'),
    filter((filePathsArray) => filePathsArray.length >= 1),
    map((filePathsArray) =>
      state$.value.jupyter.mainChannel.next(executeRequest(loadCSV(filePathsArray)))
    ),
    awaitOkMessage(action$),
    execute(filterIIR(1, 30), state$),
    awaitOkMessage(action$),
    map(() =>
      epochEvents(
        {
          [state$.value.experiment.params.stimulus1.title]: EVENTS.STIMULUS_1,
          [state$.value.experiment.params.stimulus2.title]: EVENTS.STIMULUS_2,
          [state$.value.experiment.params.stimulus3.title]: EVENTS.STIMULUS_3,
          [state$.value.experiment.params.stimulus4.title]: EVENTS.STIMULUS_4,
        },
        -0.1,
        0.8
      )
    ),
    tap((e)=> {console.log('e', e)}),
    map((epochEventsCommand) =>
      state$.value.jupyter.mainChannel.next(executeRequest(epochEventsCommand))
    ),
    awaitOkMessage(action$),
    map(() => getEpochsInfo(PYODIDE_VARIABLE_NAMES.RAW_EPOCHS))
  );

const loadCleanedEpochsEpic = (action$, state$) =>
  action$.ofType(LOAD_CLEANED_EPOCHS).pipe(
    pluck('payload'),
    filter((filePathsArray) => filePathsArray.length >= 1),
    map((filePathsArray) =>
      state$.value.jupyter.mainChannel.next(executeRequest(loadCleanedEpochs(filePathsArray)))
    ),
    awaitOkMessage(action$),
    mergeMap(() =>
      of(
        getEpochsInfo(PYODIDE_VARIABLE_NAMES.CLEAN_EPOCHS),
        getChannelInfo(),
        loadTopo()
      )
    )
  );

const cleanEpochsEpic = (action$, state$) =>
  action$.ofType(CLEAN_EPOCHS).pipe(
    execute(cleanEpochsPlot(), state$),
    mergeMap(() =>
      action$.ofType(RECEIVE_STREAM).pipe(
        pluck('payload'),
        filter(
          (msg) => msg.channel === 'iopub' && msg.content.text.includes('Channels marked as bad')
        ),
        take(1)
      )
    ),
    map(() =>
      state$.value.jupyter.mainChannel.next(
        executeRequest(
          saveEpochs(
            getWorkspaceDir(state$.value.experiment.title),
            state$.value.experiment.subject
          )
        )
      )
    ),
    awaitOkMessage(action$),
    map(() => getEpochsInfo(PYODIDE_VARIABLE_NAMES.RAW_EPOCHS))
  );

const getEpochsInfoEpic = (action$, state$) =>
  action$.ofType(GET_EPOCHS_INFO).pipe(
    pluck('payload'),
    map((variableName) =>
      state$.value.jupyter.mainChannel.next(executeRequest(requestEpochsInfo(variableName)))
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_RESULT).pipe(
        pluck('payload'),
        filter((msg) => msg.channel === 'iopub' && !isNil(msg.content.data)),
        pluck('content', 'data', 'text/plain'),
        filter((msg) => msg.includes('Drop Percentage')),
        take(1)
      )
    ),
    map((epochInfoString) =>
      parseSingleQuoteJSON(epochInfoString).map((infoObj) => ({
        name: Object.keys(infoObj)[0],
        value: infoObj[Object.keys(infoObj)[0]],
      }))
    ),
    map(setEpochInfo)
  );

const getChannelInfoEpic = (action$, state$) =>
  action$.ofType(GET_CHANNEL_INFO).pipe(
    execute(requestChannelInfo(), state$),
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_RESULT).pipe(
        pluck('payload'),
        filter((msg) => msg.channel === 'iopub' && !isNil(msg.content.data)),
        pluck('content', 'data', 'text/plain'),
        // Filter to prevent this from reading requestEpochsInfo returns
        filter((msg) => !msg.includes('Drop Percentage')),
        take(1)
      )
    ),
    map((channelInfoString) => setChannelInfo(parseSingleQuoteJSON(channelInfoString)))
  );

const loadPSDEpic = (action$, state$) =>
  action$.ofType(LOAD_PSD).pipe(
    execute(plotPSD(), state$),
    mergeMap(() =>
      action$.ofType(RECEIVE_DISPLAY_DATA).pipe(
        pluck('payload'),
        // PSD graphs should have two axes
        filter((msg) => msg.content.data['text/plain'].includes('2 Axes')),
        pluck('content', 'data'),
        take(1)
      )
    ),
    map(setPSDPlot)
  );

const loadTopoEpic = (action$, state$) =>
  action$.ofType(LOAD_TOPO).pipe(
    execute(plotTopoMap(), state$),
    mergeMap(() =>
      action$.ofType(RECEIVE_DISPLAY_DATA).pipe(pluck('payload'), pluck('content', 'data'), take(1))
    ),
    mergeMap((topoPlot) =>
      of(
        setTopoPlot(topoPlot),
        loadERP(
          state$.value.device.deviceType === DEVICES.EMOTIV ? EMOTIV_CHANNELS[0] : MUSE_CHANNELS[0]
        )
      )
    )
  );

const loadERPEpic = (action$, state$) =>
  action$.ofType(LOAD_ERP).pipe(
    pluck('payload'),
    map((channelName) => {
      if (MUSE_CHANNELS.includes(channelName)) {
        return MUSE_CHANNELS.indexOf(channelName);
      } else if (EMOTIV_CHANNELS.includes(channelName)) {
        return EMOTIV_CHANNELS.indexOf(channelName);
      }
      console.warn('channel name supplied to loadERPEpic does not belong to either device');
      return EMOTIV_CHANNELS[0];
    }),
    map((channelIndex) =>
      state$.value.jupyter.mainChannel.next(executeRequest(plotERP(channelIndex)))
    ),
    mergeMap(() =>
      action$.ofType(RECEIVE_DISPLAY_DATA).pipe(
        pluck('payload'),
        // ERP graphs should have 1 axis according to MNE
        filter((msg) => msg.content.data['text/plain'].includes('1 Axes')),
        pluck('content', 'data'),
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
  loadCleanedEpochsEpic,
  cleanEpochsEpic,
  getEpochsInfoEpic,
  getChannelInfoEpic,
  loadPSDEpic,
  loadTopoEpic,
  loadERPEpic,
  closeKernelEpic
);
