import { combineEpics, Epic } from 'redux-observable';
import { from, of, ObservableInput } from 'rxjs';
import {
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
  filter,
  take,
} from 'rxjs/operators';
import { find } from 'kernelspecs';
import { launchSpec } from 'spawnteract';
import { createMainChannel } from 'enchannel-zmq-backend';
import { isNil } from 'lodash';
import { kernelInfoRequest, executeRequest } from '@nteract/messaging';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import { PyodideActions, PyodideActionType } from '../actions';
import { execute, awaitOkMessage } from '../utils/pyodide/pipes';
import { RootState } from '../reducers';
import { getWorkspaceDir } from '../utils/filesystem/storage';
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
  saveEpochs,
} from '../utils/pyodide/cells';
import {
  EMOTIV_CHANNELS,
  EVENTS,
  DEVICES,
  MUSE_CHANNELS,
  PYODIDE_VARIABLE_NAMES,
} from '../constants/constants';
import {
  parseSingleQuoteJSON,
  debugParseMessage,
} from '../utils/pyodide/functions';

// -------------------------------------------------------------------------
// Epics

const launchEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LaunchKernel)),
    mergeMap(() => from(find('brainwaves'))),
    tap((kernelInfo) => {
      if (isNil(kernelInfo)) {
        toast.error(
          "Could not find 'brainwaves' jupyter kernel. Have you installed Python?"
        );
      }
    }),
    filter((kernelInfo) => !isNil(kernelInfo)),
    mergeMap<any, ObservableInput<any>>((kernelInfo) =>
      from(
        launchSpec(kernelInfo.spec, {
          // No STDIN, opt in to STDOUT and STDERR as node streams
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      )
    ),
    tap((kernel) => {
      // Route everything that we won't get in messages to our own stdout
      kernel.spawn.stdout.on('data', (data) => {
        const text = data.toString();
        console.log('KERNEL STDOUT: ', text);
      });
      kernel.spawn.stderr.on('data', (data) => {
        const text = data.toString();
        console.log('KERNEL STDERR: ', text);
        toast.error('Jupyter: ', text);
      });

      kernel.spawn.on('close', () => {
        console.log('Kernel closed');
      });
    }),
    map(JupyterActions.SetKernel)
  );

const setUpChannelEpic: Epic<
  JupyterActionType,
  JupyterActionType,
  RootState
> = (action$) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.SetKernel)),
    pluck('payload'),
    mergeMap((kernel) => from(createMainChannel(kernel.config))),
    tap((mainChannel) => mainChannel.next(executeRequest(imports()))),
    tap((mainChannel) => mainChannel.next(executeRequest(utils()))),
    map(JupyterActions.SetMainChannel)
  );

const receiveChannelMessageEpic: Epic<
  JupyterActionType,
  JupyterActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.SetMainChannel)),
    mergeMap<Record<string, unknown>, ObservableInput<JupyterActionType>>(() =>
      state$.value.jupyter.mainChannel.pipe(
        map<{ header: { msg_type: string } }, JupyterActionType>((msg) => {
          console.log(debugParseMessage(msg));
          switch (msg.header.msg_type) {
            case 'kernel_info_reply':
              return JupyterActions.SetKernelInfo(msg);
            case 'status':
              return JupyterActions.SetKernelStatus(parseKernelStatus(msg));
            case 'stream':
              return JupyterActions.ReceiveStream(msg);
            case 'execute_reply':
              return JupyterActions.ReceiveExecuteReply(msg);
            case 'execute_result':
              return JupyterActions.ReceiveExecuteResult(msg);
            case 'display_data':
            default:
              return JupyterActions.ReceiveDisplayData(msg);
          }
        })
      )
    )
  );

const requestKernelInfoEpic: Epic<
  JupyterActionType,
  JupyterActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.RequestKernelInfo)),
    filter(() => state$.value.jupyter.mainChannel),
    map(() => state$.value.jupyter.mainChannel.next(kernelInfoRequest())),
    ignoreElements()
  );

const loadEpochsEpic: Epic<JupyterActionType, JupyterActionType, RootState> = (
  action$,
  state$
) =>
  // @ts-expect-error
  action$.pipe(
    filter(isActionOf(JupyterActions.LoadEpochs)),
    pluck('payload'),
    filter((filePathsArray) => filePathsArray.length >= 1),
    map((filePathsArray) =>
      state$.value.jupyter.mainChannel.next(
        executeRequest(loadCSV(filePathsArray))
      )
    ),
    awaitOkMessage(action$),
    execute(filterIIR(1, 30), state$),
    awaitOkMessage(action$),
    map(() => {
      if (!state$.value.experiment.params?.stimuli) {
        return {};
      }

      return epochEvents(
        Object.fromEntries(
          state$.value.experiment.params?.stimuli.map((stimulus, i) => [
            stimulus.title,
            i,
          ])
        ),
        -0.1,
        0.8
      );
    }),
    tap((e) => {
      console.log('e', e);
    }),
    map((epochEventsCommand) =>
      state$.value.jupyter.mainChannel.next(executeRequest(epochEventsCommand))
    ),
    awaitOkMessage(action$),
    map(() => JupyterActions.GetEpochsInfo(JUPYTER_VARIABLE_NAMES.RAW_EPOCHS))
  );

const loadCleanedEpochsEpic: Epic<
  JupyterActionType,
  JupyterActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.LoadCleanedEpochs)),
    pluck('payload'),
    filter((filePathsArray) => filePathsArray.length >= 1),
    map((filePathsArray) =>
      state$.value.jupyter.mainChannel.next(
        executeRequest(loadCleanedEpochs(filePathsArray))
      )
    ),
    awaitOkMessage(action$),
    mergeMap(() =>
      of(
        JupyterActions.GetEpochsInfo(JUPYTER_VARIABLE_NAMES.CLEAN_EPOCHS),
        JupyterActions.GetChannelInfo(),
        JupyterActions.LoadTopo()
      )
    )
  );

const cleanEpochsEpic: Epic<JupyterActionType, JupyterActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.CleanEpochs)),
    execute(cleanEpochsPlot(), state$),
    mergeMap(() =>
      action$.ofType(JupyterActions.ReceiveStream.type).pipe(
        pluck('payload'),
        filter(
          (msg) =>
            msg.channel === 'iopub' &&
            msg.content.text.includes('Channels marked as bad')
        ),
        take(1)
      )
    ),
    map(() =>
      state$.value.jupyter.mainChannel.next(
        executeRequest(
          saveEpochs(
            getWorkspaceDir(state$.value.experiment.title!),
            state$.value.experiment.subject
          )
        )
      )
    ),
    awaitOkMessage(action$),
    map(() => JupyterActions.GetEpochsInfo(JUPYTER_VARIABLE_NAMES.RAW_EPOCHS))
  );

const getEpochsInfoEpic: Epic<
  JupyterActionType,
  JupyterActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.GetEpochsInfo)),
    pluck('payload'),
    map((variableName) =>
      state$.value.jupyter.mainChannel.next(
        executeRequest(requestEpochsInfo(variableName))
      )
    ),
    mergeMap(() =>
      action$.ofType(JupyterActions.ReceiveExecuteReply.type).pipe(
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
    map(JupyterActions.SetEpochInfo)
  );

const getChannelInfoEpic: Epic<
  JupyterActionType,
  JupyterActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.GetChannelInfo)),
    execute(requestChannelInfo(), state$),
    mergeMap(() =>
      action$.ofType(JupyterActions.ReceiveExecuteResult.type).pipe(
        pluck('payload'),
        filter((msg) => msg.channel === 'iopub' && !isNil(msg.content.data)),
        pluck('content', 'data', 'text/plain'), // Filter to prevent this from reading requestEpochsInfo returns
        filter((msg) => !msg.includes('Drop Percentage')),
        take(1)
      )
    ),
    map((channelInfoString) =>
      JupyterActions.SetChannelInfo(parseSingleQuoteJSON(channelInfoString))
    )
  );

const loadPSDEpic: Epic<JupyterActionType, JupyterActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.LoadPSD)),
    execute(plotPSD(), state$),
    mergeMap(() =>
      action$.ofType(JupyterActions.ReceiveDisplayData.type).pipe(
        pluck('payload'), // PSD graphs should have two axes
        filter((msg) => msg.content.data['text/plain'].includes('2 Axes')),
        pluck('content', 'data'),
        take(1)
      )
    ),
    map(JupyterActions.SetPSDPlot)
  );

const loadTopoEpic: Epic<JupyterActionType, JupyterActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.LoadTopo)),
    execute(plotTopoMap(), state$),
    mergeMap(() =>
      action$
        .ofType(JupyterActions.ReceiveDisplayData.type)
        .pipe(pluck('payload'), pluck('content', 'data'), take(1))
    ),
    mergeMap((topoPlot) =>
      of(
        JupyterActions.SetTopoPlot(topoPlot),
        JupyterActions.LoadERP(
          state$.value.device.deviceType === DEVICES.EMOTIV
            ? EMOTIV_CHANNELS[0]
            : MUSE_CHANNELS[0]
        )
      )
    )
  );

const loadERPEpic: Epic<JupyterActionType, JupyterActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.LoadERP)),
    pluck('payload'),
    map((channelName) => {
      if (MUSE_CHANNELS.includes(channelName)) {
        return MUSE_CHANNELS.indexOf(channelName);
      }
      if (EMOTIV_CHANNELS.includes(channelName)) {
        return EMOTIV_CHANNELS.indexOf(channelName);
      }
      console.warn(
        'channel name supplied to loadERPEpic does not belong to either device'
      );
      return EMOTIV_CHANNELS[0];
    }),
    map((channelIndex) =>
      state$.value.jupyter.mainChannel.next(
        executeRequest(plotERP(channelIndex))
      )
    ),
    mergeMap(() =>
      action$.ofType(JupyterActions.ReceiveDisplayData.type).pipe(
        pluck('payload'), // ERP graphs should have 1 axis according to MNE
        filter((msg) => msg.content.data['text/plain'].includes('1 Axes')),
        pluck('content', 'data'),
        take(1)
      )
    ),
    map(JupyterActions.SetERPPlot)
  );

const closeKernelEpic: Epic<JupyterActionType, JupyterActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(JupyterActions.CloseKernel)),
    map(() => {
      state$.value.jupyter.kernel?.spawn.kill();
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
