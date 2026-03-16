import { combineEpics, Epic } from 'redux-observable';
import { EMPTY, fromEvent, Observable, of } from 'rxjs';
import { map, mergeMap, tap, pluck, filter } from 'rxjs/operators';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import { PyodideActions, PyodideActionType } from '../actions';
import { RootState } from '../reducers';
import { getWorkspaceDir } from '../utils/filesystem/storage';
import {
  loadCSV,
  loadCleanedEpochs,
  writeEpochsToMemfs,
  filterIIR,
  epochEvents,
  requestEpochsInfo,
  requestChannelInfo,
  cleanEpochsPlot,
  plotPSD,
  plotERP,
  plotTopoMap,
  saveEpochs,
  loadPyodide,
  loadPatches,
  applyPatches,
  loadUtils,
} from '../utils/webworker';
import {
  EMOTIV_CHANNELS,
  MUSE_CHANNELS,
  PYODIDE_VARIABLE_NAMES,
} from '../constants/constants';

import { readFiles } from '../utils/filesystem/read';

// -------------------------------------------------------------------------
// Epics

const launchEpic: Epic<PyodideActionType, PyodideActionType, RootState> = (
  action$
) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.Launch)),
    tap(() => console.log('launching')),
    mergeMap(async () => {
      const worker = await loadPyodide();
      console.log('loadPyodide completed, loading patches');
      // Fire init messages in order — worker processes them sequentially.
      // patches.py defines apply_patches(); applyPatches() calls it; loadUtils()
      // runs utils.py and responds with plotKey:'ready' → SetWorkerReady.
      loadPatches(worker);
      applyPatches(worker);
      console.log('Now loading utils');
      loadUtils(worker);
      return worker;
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
// Create an observable of events that correspond to what it returns
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
      const { results, error, plotKey, dataKey } = e.data;
      if (error) {
        toast.error(`Pyodide: ${error}`);
        return of(PyodideActions.ReceiveError(error));
      }

      // Route data results (returned via dataKey, not plotKey).
      if (dataKey === 'epochsInfo') {
        // results is a JS array of single-key objects like [{Condition1: 10}, {'Drop Percentage': 5}]
        const epochInfoArray = (
          results as Array<Record<string, string | number>>
        ).map((infoObj) => ({
          name: Object.keys(infoObj)[0],
          value: infoObj[Object.keys(infoObj)[0]],
        }));
        return of(PyodideActions.SetEpochInfo(epochInfoArray));
      }
      if (dataKey === 'channelInfo') {
        // results is a JS array of channel name strings
        return of(PyodideActions.SetChannelInfo(results as string[]));
      }

      // Route plot results to the appropriate Redux state slot.
      const mimeBundle = results ? { 'image/svg+xml': results } : null;
      switch (plotKey) {
        case 'ready':
          return of(PyodideActions.SetWorkerReady());
        case 'topo':
          return of(PyodideActions.SetTopoPlot(mimeBundle));
        case 'psd':
          return of(PyodideActions.SetPSDPlot(mimeBundle));
        case 'erp':
          return of(PyodideActions.SetERPPlot(mimeBundle));
        default:
          return of(PyodideActions.ReceiveMessage(e.data));
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
    mergeMap(async (filePathsArray) => {
      const worker = state$.value.pyodide.worker!;
      // readFiles must be awaited before passing csvArray to worker
      const csvArray = await readFiles(filePathsArray);
      // Queue all processing messages in order — worker runs them sequentially
      loadCSV(worker, csvArray);
      filterIIR(worker, 1, 30);
      if (state$.value.experiment.params?.stimuli) {
        epochEvents(
          worker,
          Object.fromEntries(
            state$.value.experiment.params.stimuli.map((stimulus, i) => [
              stimulus.title,
              i,
            ])
          ),
          -0.1,
          0.8
        );
      }
      // Request epochs info — result returns via pyodideMessageEpic → SetEpochInfo
      requestEpochsInfo(worker, PYODIDE_VARIABLE_NAMES.RAW_EPOCHS);
    }),
    mergeMap(() => EMPTY)
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
    mergeMap(async (epochsArray) => {
      // Read .fif files from the host OS and stage them in Pyodide's MEMFS.
      // Pyodide's WASM filesystem cannot access host OS paths directly.
      const { memfsPaths, fsFiles } = await writeEpochsToMemfs(epochsArray);
      loadCleanedEpochs(state$.value.pyodide.worker!, memfsPaths, fsFiles);
    }),
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
    // Fire-and-forget: result returns asynchronously via pyodideMessageEpic → SetEpochInfo
    tap((varName) => requestEpochsInfo(state$.value.pyodide.worker!, varName)),
    mergeMap(() => EMPTY)
  );

const getChannelInfoEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.GetChannelInfo)),
    // Fire-and-forget: result returns asynchronously via pyodideMessageEpic → SetChannelInfo
    tap(() => requestChannelInfo(state$.value.pyodide.worker!)),
    mergeMap(() => EMPTY)
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
    tap(() => plotTopoMap(state$.value.pyodide.worker!)),
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
      let index: number | null = null;
      if (MUSE_CHANNELS.includes(channelName)) {
        index = MUSE_CHANNELS.indexOf(channelName);
      }
      if (EMOTIV_CHANNELS.includes(channelName)) {
        index = EMOTIV_CHANNELS.indexOf(channelName);
      }
      if (index !== null) {
        return index;
      }
      console.warn(
        'channel name supplied to loadERPEpic does not belong to either device'
      );
      return parseInt(EMOTIV_CHANNELS[0], 10);
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
