import { combineEpics, Epic } from 'redux-observable';
import Rx, { fromEvent, Observable, ObservableInput, of } from 'rxjs';
import { map, mergeMap, tap, pluck, filter } from 'rxjs/operators';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import { PyodideActions, PyodideActionType } from '../actions';
import { RootState } from '../reducers';
import { getWorkspaceDir } from '../utils/filesystem/storage';
import {
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
  plotTestPlot,
  saveEpochs,
  loadPyodide,
  loadPatches,
  applyPatches,
  loadUtils,
} from '../utils/pyodide';
import {
  EMOTIV_CHANNELS,
  DEVICES,
  MUSE_CHANNELS,
  PYODIDE_VARIABLE_NAMES,
} from '../constants/constants';
import { parseSingleQuoteJSON } from '../utils/pyodide/functions';

import { readFiles } from '../utils/filesystem/read';

// -------------------------------------------------------------------------
// Epics

const launchEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.Launch)),
    tap(() => console.log('launching')),
    mergeMap(loadPyodide),
    tap((worker) => {
      console.log('loadPyodide completed, loading patches');
      loadPatches(worker);
      applyPatches(worker);
      console.log('Now loading utils');
      loadUtils(worker);
    }),
    map(PyodideActions.SetPyodideWorker)
  );

const pyodideErrorEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.SetPyodideWorker)),
    pluck('payload'),
    mergeMap<Worker, Observable<any>>((worker) => {
      return fromEvent(worker, 'error');
    }),
    tap((e) =>
      toast.error(
        `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
      )
    ),
    map(PyodideActions.ReceiveError)
  );

// Once pyodide webworker is created,
// Create an observable of events that corresond to what it retjurns
// and then emite those events as redux actions
const pyodideMessageEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.SetPyodideWorker)),
    pluck('payload'),
    mergeMap<Worker, Observable<any>>((worker) => {
      return fromEvent(worker, 'message');
    }),
    tap((e) => {
      console.log(e);
      const { results, error } = e.data;

      if (results && !error) {
        toast.error(`Pyodide: ${results}`);
      } else if (error) {
        toast.error(`Pyodide: ${error}`);
      }
    }),
    map(PyodideActions.ReceiveMessage)
  );

const loadEpochsEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LoadEpochs)),
    pluck('payload'),
    filter((filePathsArray: string[]) => filePathsArray.length >= 1),
    map((filePathsArray) => readFiles(filePathsArray)),
    mergeMap((csvArray) => loadCSV(state$.value.pyodide.worker!, csvArray)),
    mergeMap(() => filterIIR(state$.value.pyodide.worker!, 1, 30)),
    map(() => {
      if (!state$.value.experiment.params?.stimuli) {
        return {};
      }

      return epochEvents(
        state$.value.pyodide.worker!,
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
      console.log('epoched events: ', e);
    }),
    map(() => PyodideActions.GetEpochsInfo(PYODIDE_VARIABLE_NAMES.RAW_EPOCHS))
  );

const loadCleanedEpochsEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LoadCleanedEpochs)),
    pluck('payload'),
    filter((filePathsArray) => filePathsArray.length >= 1),
    map((epochsArray) =>
      loadCleanedEpochs(state$.value.pyodide.worker!, epochsArray)
    ),
    mergeMap(() =>
      of(
        PyodideActions.GetEpochsInfo(PYODIDE_VARIABLE_NAMES.CLEAN_EPOCHS),
        PyodideActions.GetChannelInfo(),
        PyodideActions.LoadTopo()
      )
    )
  );

const cleanEpochsEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.CleanEpochs)),
    mergeMap(() => cleanEpochsPlot(state$.value.pyodide.worker!)),
    map(() =>
      saveEpochs(
        state$.value.pyodide.worker!,
        getWorkspaceDir(state$.value.experiment.title),
        state$.value.experiment.subject
      )
    ),
    map(() => PyodideActions.GetEpochsInfo(PYODIDE_VARIABLE_NAMES.RAW_EPOCHS))
  );

const getEpochsInfoEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.GetEpochsInfo)),
    pluck('payload'),
    mergeMap((varName) =>
      requestEpochsInfo(state$.value.pyodide.worker!, varName)
    ),
    map((epochInfoArray) =>
      epochInfoArray.map((infoObj) => ({
        name: Object.keys(infoObj)[0],
        value: infoObj[Object.keys(infoObj)[0]],
      }))
    ),
    map(PyodideActions.SetEpochInfo)
  );

const getChannelInfoEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.GetChannelInfo)),
    mergeMap(() => requestChannelInfo(state$.value.pyodide.worker!)),
    map((channelInfoString) =>
      PyodideActions.SetChannelInfo(parseSingleQuoteJSON(channelInfoString))
    )
  );

const loadPSDEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LoadPSD)),
    mergeMap(() => plotPSD(state$.value.pyodide.worker!)),
    map(PyodideActions.SetPSDPlot)
  );

const loadTopoEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LoadTopo)),
    // mergeMap(plotTopoMap),
    mergeMap(() => plotTestPlot(state$.value.pyodide.worker!)),
    tap((e) => console.log('received topo map: ', e)),
    mergeMap((topoPlot) =>
      of(
        PyodideActions.SetTopoPlot(topoPlot)
        // PyodideActions.LoadERP(
        //   state$.value.device.deviceType === DEVICES.EMOTIV
        //     ? EMOTIV_CHANNELS[0]
        //     : MUSE_CHANNELS[0]
        // )
      )
    )
  );

const loadERPEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LoadERP)),
    pluck('payload'),
    map((channelName: string) => {
      let index: number | null = null;
      if (MUSE_CHANNELS.includes(channelName)) {
        index = MUSE_CHANNELS.indexOf(channelName);
      }
      if (EMOTIV_CHANNELS.includes(channelName)) {
        index = EMOTIV_CHANNELS.indexOf(channelName);
      }
      if (index) {
        return index;
      }
      console.warn(
        'channel name supplied to loadERPEpic does not belong to either device'
      );
      return parseInt(EMOTIV_CHANNELS[0], 10);
    }),
    mergeMap((chanIndex) => plotERP(state$.value.pyodide.worker!, chanIndex)),
    map(PyodideActions.SetERPPlot)
  );

export default combineEpics(
  launchEpic,
  pyodideMessageEpic,
  pyodideErrorEpic,
  loadEpochsEpic,
  loadCleanedEpochsEpic,
  cleanEpochsEpic,
  getEpochsInfoEpic,
  getChannelInfoEpic,
  loadPSDEpic,
  loadTopoEpic,
  loadERPEpic
);
