import { combineEpics, Epic } from 'redux-observable';
import { EMPTY, fromEvent, Observable, ObservableInput, of } from 'rxjs';
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
} from '../utils/webworker';
import {
  DEVICES,
  MUSE_CHANNELS,
  PYODIDE_VARIABLE_NAMES,
} from '../constants/constants';
import { parseSingleQuoteJSON } from '../utils/webworker/functions';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergeMap<Worker, Observable<any>>((worker) => {
      // Worker error event — ErrorEvent shape varies by runtime
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
// Create an observable of events that corresond to what it returns
// and then emits those events as redux actions
const pyodideMessageEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.SetPyodideWorker)),
    pluck('payload'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergeMap<Worker, Observable<any>>((worker) => fromEvent(worker, 'message')),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergeMap<any, Observable<any>>((e) => {
      const { results, error, plotKey } = e.data;
      if (error) {
        toast.error(`Pyodide: ${error}`);
        return of(PyodideActions.ReceiveError(error));
      }
      // Route plot results to the appropriate Redux state slot.
      // results is a base64-encoded PNG string returned from Python.
      const mimeBundle = results ? { 'image/svg+xml': results } : null;
      switch (plotKey) {
        case 'ready': return of(PyodideActions.SetWorkerReady());
        case 'topo': return of(PyodideActions.SetTopoPlot(mimeBundle));
        case 'psd':  return of(PyodideActions.SetPSDPlot(mimeBundle));
        case 'erp':  return of(PyodideActions.SetERPPlot(mimeBundle));
        default:     return of(PyodideActions.ReceiveMessage(e.data));
      }
    })
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
    mergeMap(async () => {
      await cleanEpochsPlot(state$.value.pyodide.worker!);
      const dir = await getWorkspaceDir(state$.value.experiment.title);
      return saveEpochs(
        state$.value.pyodide.worker!,
        dir,
        state$.value.experiment.subject
      );
    }),
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
    mergeMap(
      (varName) =>
        requestEpochsInfo(
          state$.value.pyodide.worker!,
          varName
        ) as unknown as Promise<Record<string, string | number>[]>
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
    mergeMap(
      () =>
        requestChannelInfo(
          state$.value.pyodide.worker!
        ) as unknown as Promise<string>
    ),
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
    tap(() => plotPSD(state$.value.pyodide.worker!)),
    mergeMap(() => EMPTY)
  );

const loadTopoEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LoadTopo)),
    tap(() => plotTestPlot(state$.value.pyodide.worker!)),
    mergeMap(() => EMPTY)
  );

const loadERPEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.LoadERP)),
    pluck('payload'),
    map((channelName: string) => {
      const index = MUSE_CHANNELS.includes(channelName)
        ? MUSE_CHANNELS.indexOf(channelName)
        : 0;
      if (!MUSE_CHANNELS.includes(channelName)) {
        console.warn(
          'channel name supplied to loadERPEpic does not belong to a known Muse channel'
        );
      }
      return index;
    }),
    tap((chanIndex) => plotERP(state$.value.pyodide.worker!, chanIndex)),
    mergeMap(() => EMPTY)
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
