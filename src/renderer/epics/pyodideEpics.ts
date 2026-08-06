import { combineEpics, Epic } from 'redux-observable';
import { EMPTY, from, fromEvent, Observable, of } from 'rxjs';
import { map, mergeMap, tap, pluck, filter, catchError } from 'rxjs/operators';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import {
  PyodideActions,
  PyodideActionType,
  EpochArraysMeta,
  SuggestedRejection,
} from '../actions';
import { RootState } from '../reducers';
import { buildMarkerRegistry } from '../utils/eeg/markerRegistry';
import {
  loadCSV,
  loadCleanedEpochs,
  writeEpochsToMemfs,
  filterIIR,
  epochEvents,
  requestEpochsInfo,
  requestChannelInfo,
  requestEpochArrays,
  requestSuggestRejections,
  applyRejection,
  plotPSD,
  plotERP,
  plotTopoMap,
  saveEpochs,
  loadPyodide,
  loadPatches,
  applyPatches,
  loadUtils,
} from '../utils/webworker';
import { MUSE_CHANNELS, PYODIDE_VARIABLE_NAMES } from '../constants/constants';

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
> = (action$, state$) =>
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

      // Route data results (tagged with dataKey, not plotKey). These come back
      // as plain JS (the worker converts the PyProxy before postMessage).
      if (dataKey === 'epochsInfo') {
        // results is an array of single-key objects, e.g. [{Condition1: 10}, {'Drop Percentage': 5}]
        const epochInfoArray = (
          results as Array<Record<string, string | number>>
        ).map((infoObj) => ({
          name: Object.keys(infoObj)[0],
          value: infoObj[Object.keys(infoObj)[0]],
        }));
        return of(PyodideActions.SetEpochInfo(epochInfoArray));
      }
      if (dataKey === 'channelInfo') {
        // results is an array of channel-name strings
        return of(PyodideActions.SetChannelInfo(results as string[]));
      }
      if (dataKey === 'epochArrays') {
        return of(
          PyodideActions.SetEpochArrays({
            buffer: e.data.buffer as ArrayBuffer,
            meta: results as EpochArraysMeta,
          })
        );
      }
      if (dataKey === 'suggestedRejections') {
        return of(
          PyodideActions.SetSuggestedRejections(results as SuggestedRejection[])
        );
      }
      if (dataKey === 'savedEpochs') {
        const savedEpochsBuffer = e.data.buffer as ArrayBuffer | undefined;
        // Surface a dropped/empty save instead of writing nothing silently —
        // that path left the Analyze picker mysteriously empty with no error.
        if (!savedEpochsBuffer || savedEpochsBuffer.byteLength === 0) {
          toast.error(
            'Could not save cleaned data — the recording came back empty. Nothing was written.'
          );
          return EMPTY;
        }
        const { title, subject } = state$.value.experiment;
        return from(
          window.electronAPI.writeCleanedEpochs(
            title,
            subject,
            savedEpochsBuffer
          )
        ).pipe(
          tap(() => toast.success('Cleaned data saved')),
          mergeMap(() => EMPTY),
          catchError((err) => {
            toast.error(`Failed to save cleaned data: ${err?.message ?? err}`);
            return EMPTY;
          })
        );
      }

      // Route plot results to the appropriate Redux state slot.
      // results is an SVG string returned from Python.
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
      // readFiles is async — await before posting csvArray to the worker.
      // (An unresolved Promise into postMessage throws DataCloneError.)
      const csvArray = await readFiles(filePathsArray);
      // Queue processing messages in order; the worker runs them sequentially.
      loadCSV(worker, csvArray);
      filterIIR(worker, 1, 30);
      if (state$.value.experiment.params?.stimuli) {
        // event_id VALUES must equal the numeric codes written to the CSV Marker
        // column (stimulus.type). buildMarkerRegistry keeps this in lockstep with
        // collection — array indices silently dropped codes that didn't match.
        const { eventId } = buildMarkerRegistry(
          state$.value.experiment.params.stimuli
        );
        epochEvents(worker, eventId, -0.1, 0.8);
      }
      // Result returns asynchronously via pyodideMessageEpic → SetEpochInfo.
      requestEpochsInfo(worker, PYODIDE_VARIABLE_NAMES.RAW_EPOCHS);
      // Fetch epoch arrays for the interactive reviewer (dataKey 'epochArrays').
      requestEpochArrays(worker, PYODIDE_VARIABLE_NAMES.RAW_EPOCHS);
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
      // .fif epochs live on the host OS; stage them in Pyodide's MEMFS first
      // (the WASM filesystem can't reach host paths).
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
    pluck('payload'),
    mergeMap(async ({ dropIndices, badChannels }) => {
      const worker = state$.value.pyodide.worker!;
      // Worker runs these FIFO: drop/flag -> save cleaned .fif -> re-fetch arrays.
      applyRejection(
        worker,
        PYODIDE_VARIABLE_NAMES.RAW_EPOCHS,
        dropIndices,
        badChannels
      );
      saveEpochs(worker, state$.value.experiment.subject);
      requestEpochArrays(worker, PYODIDE_VARIABLE_NAMES.RAW_EPOCHS);
      return PYODIDE_VARIABLE_NAMES.RAW_EPOCHS;
    }),
    map((varName) => PyodideActions.GetEpochsInfo(varName))
  );

const getEpochsInfoEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.GetEpochsInfo)),
    pluck('payload'),
    // Fire-and-forget: result returns via pyodideMessageEpic → SetEpochInfo.
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
    // Fire-and-forget: result returns via pyodideMessageEpic → SetChannelInfo.
    tap(() => requestChannelInfo(state$.value.pyodide.worker!)),
    mergeMap(() => EMPTY)
  );

const getSuggestedRejectionsEpic: Epic<
  PyodideActionType,
  PyodideActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(PyodideActions.GetSuggestedRejections)),
    pluck('payload'),
    tap((threshold) =>
      requestSuggestRejections(
        state$.value.pyodide.worker!,
        PYODIDE_VARIABLE_NAMES.RAW_EPOCHS,
        threshold
      )
    ),
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
  getSuggestedRejectionsEpic,
  loadPSDEpic,
  loadTopoEpic,
  loadERPEpic
);
