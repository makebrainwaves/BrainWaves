import { combineEpics, Epic, ofType } from 'redux-observable';
import { concat, fromEvent, of, race, timer } from 'rxjs';
import {
  map,
  mergeMap,
  exhaustMap,
  filter,
  switchMap,
  take,
  takeUntil,
  debounceTime,
  tap,
} from 'rxjs/operators';
import { toast } from 'react-toastify';
import { isActionOf } from '../utils/redux';
import {
  DeviceActions,
  ExperimentActions,
  ExperimentActionType,
} from '../actions';
import { RouterActions } from '../actions/routerActions';
import { MUSE_CHANNELS, CONNECTION_STATUS } from '../constants/constants';
import { isWorkspaceRoute } from '../components/AppShell/areas';
import {
  closeEEGStream,
  createEEGWriteStream,
  writeHeader,
  writeEEGData,
  writeEEGEvents,
} from '../utils/filesystem/write';
import { resolveMarkerRegistry } from '../utils/eeg/markerRegistry';
import {
  storeExperimentState,
  restoreExperimentState,
  createWorkspaceDir,
  storeBehavioralData,
  markRecordingIncomplete,
  getWorkspaceDir,
} from '../utils/filesystem/storage';
import { RootState } from '../reducers';
import { WorkSpaceInfo } from '../constants/interfaces';
import { getExperimentFromType } from '../utils/labjs/functions';

// -------------------------------------------------------------------------
// Epics

const createNewWorkspaceEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.CreateNewWorkspace)),
    map((action) => action.payload as WorkSpaceInfo),
    mergeMap(async (workspaceInfo) => {
      await createWorkspaceDir(workspaceInfo.title);
      const experiment = getExperimentFromType(workspaceInfo.type);
      // An imported study's contract arrives WITH the workspace request, so
      // there is no window in which `type` is IMPORTED but `params.imported` is
      // still the empty default.
      const params = workspaceInfo.imported
        ? { ...experiment.params, imported: workspaceInfo.imported }
        : experiment.params;
      return [
        ExperimentActions.SetTitle(workspaceInfo.title),
        ExperimentActions.SetType(workspaceInfo.type),
        ExperimentActions.SetExperimentObject(experiment?.experimentObject),
        ExperimentActions.SetParams(params),
      ];
    }),
    mergeMap((actions) => of(...actions))
  );

/** The open raw-EEG write stream of the current run; closed by the stop epic. */
let activeEEGStream: string | null = null;

const startEpic = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.Start)),
    filter(() => !state$.value.experiment.isRunning),
    mergeMap(async () => {
      activeEEGStream = null;
      await createWorkspaceDir(state$.value.experiment.title);
      if (
        state$.value.device.connectionStatus === CONNECTION_STATUS.CONNECTED
      ) {
        const streamId = await createEEGWriteStream(
          state$.value.experiment.title,
          state$.value.experiment.subject,
          state$.value.experiment.group,
          state$.value.experiment.session
        );

        if (!streamId) {
          return true;
        }
        activeEEGStream = streamId;
        writeHeader(
          streamId,
          state$.value.device.connectedDevice?.channels ?? MUSE_CHANNELS
        );

        // Persist the code->label event map next to the CSV so the numeric
        // Marker codes are self-describing. Same registry the analysis uses,
        // so the recording and its interpretation can never drift apart.
        const { codeToLabel } = resolveMarkerRegistry(
          state$.value.experiment.params
        );
        void writeEEGEvents(
          state$.value.experiment.title,
          state$.value.experiment.subject,
          state$.value.experiment.group,
          state$.value.experiment.session,
          codeToLabel
        );

        state$.value.device.rawObservable
          .pipe(
            takeUntil(
              action$.pipe(
                ofType(
                  ExperimentActions.Stop.type,
                  ExperimentActions.ExperimentCleanup.type
                )
              )
            )
          )
          .subscribe((eegData) => writeEEGData(streamId, eegData));
      }
      return true;
    }),
    map(ExperimentActions.SetIsRunning)
  );

/**
 * Finalizes a run exactly once: closes the EEG stream (the raw subscription
 * already ended on Stop), writes behavior, and for an ended-early run renames
 * both files so Clean and Analyze skip them. Each step runs even if an earlier
 * one failed, so a failed behavior write never leaves an ended-early EEG file
 * discoverable. Stops arriving meanwhile are ignored.
 */
const experimentStopEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.Stop)),
    filter(() => state$.value.experiment.isRunning),
    exhaustMap(async ({ payload: { data, outcome } }) => {
      const { title, subject, group, session } = state$.value.experiment;
      const streamId = activeEEGStream;
      activeEEGStream = null;
      const failures: string[] = [];
      const step = async (work: () => Promise<void>) => {
        try {
          await work();
        } catch (error) {
          failures.push((error as Error).message);
        }
      };
      if (streamId) await step(() => closeEEGStream(streamId));
      if (title) {
        if (data)
          await step(() =>
            storeBehavioralData(data, title, subject, group, session)
          );
        if (outcome === 'incomplete')
          await step(() =>
            markRecordingIncomplete(title, subject, group, session)
          );
      }
      if (failures.length)
        toast.error(`Couldn't finish saving this run: ${failures.join('; ')}`);
      return ExperimentActions.SetIsRunning(false);
    })
  );

/** How long Escape must be held to end a run early; a tap never ends it. */
const END_EARLY_HOLD_MS = 1000;
/** ponytail: a runtime that never reports on teardown gets this long, then the run ends with no behavior data. */
const ABORT_FALLBACK_MS = 3000;

const escapeKey = (type: 'keydown' | 'keyup') =>
  fromEvent<KeyboardEvent>(window, type, { capture: true }).pipe(
    filter((event) => event.key === 'Escape')
  );

/**
 * Holding Escape for END_EARLY_HOLD_MS during a run ends it early, the same as
 * the RunBar button; letting go sooner keeps it running. Keys still reach the
 * study, whose own presentation is untouched.
 */
const escapeHoldEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  escapeKey('keydown').pipe(
    filter(
      (event) =>
        !event.repeat &&
        state$.value.experiment.isRunning &&
        !state$.value.experiment.isEnding
    ),
    exhaustMap(() =>
      concat(
        of(ExperimentActions.SetEscapeHeld(true)),
        race(
          timer(END_EARLY_HOLD_MS).pipe(map(() => ExperimentActions.EndRun())),
          escapeKey('keyup').pipe(
            take(1),
            map(() => ExperimentActions.SetEscapeHeld(false))
          )
        )
      ).pipe(
        takeUntil(action$.pipe(filter(isActionOf(ExperimentActions.Stop))))
      )
    )
  );

/** Ends an ended-early run with no behavior data if the runtime never reports. */
const endRunFallbackEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.EndRun)),
    filter(() => state$.value.experiment.isRunning),
    switchMap(() =>
      timer(ABORT_FALLBACK_MS).pipe(
        takeUntil(action$.pipe(filter(isActionOf(ExperimentActions.Stop)))),
        map(() => ExperimentActions.Stop({ data: '', outcome: 'incomplete' }))
      )
    )
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const autoSaveEpic: Epic<any, ExperimentActionType, RootState> = (
  action$ // RouterActions union requires any here
) =>
  action$.pipe(
    filter(isActionOf(RouterActions.RouteChanged)),
    map((action) => action.payload as string),
    filter(isWorkspaceRoute),
    map(() => ExperimentActions.SaveWorkspace())
  );

export const saveWorkspaceEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.SaveWorkspace)),
    map(() => state$.value.experiment),
    debounceTime(400),
    filter(({ title }) => title.length > 1),
    mergeMap(async (experiment) => {
      const now = Date.now();
      // experimentObject contains function references (hooks) that cannot be
      // serialized via IPC structured clone. It is always re-derived from
      // `type` on load (see handleLoadRecentWorkspace), so omit it here.
      const { experimentObject: _omit, ...serializableState } = experiment;
      await storeExperimentState({ ...serializableState, dateModified: now });
      return now;
    }),
    map(ExperimentActions.SetDateModified)
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigationCleanupEpic: Epic<any, ExperimentActionType, RootState> = (
  // RouterActions union requires any here
  action$
) =>
  action$.pipe(
    filter(isActionOf(RouterActions.RouteChanged)),
    tap((action) => console.log('navigation', action.payload)),
    map((action) => action.payload as string),
    filter((pathname) => !isWorkspaceRoute(pathname)),
    map(() => ExperimentActions.ExperimentCleanup())
  );

// Disconnecting a device tears down the experiment too: this triggers the BLE
// disconnect (deviceCleanupEpic) and resets experiment + pyodide state.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const disconnectFromDeviceEpic: Epic<any, ExperimentActionType, RootState> = (
  // DeviceActions input action is outside this slice's action union
  action$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.DisconnectFromDevice)),
    map(() => ExperimentActions.ExperimentCleanup())
  );

export default combineEpics(
  createNewWorkspaceEpic,
  startEpic,
  experimentStopEpic,
  escapeHoldEpic,
  endRunFallbackEpic,
  autoSaveEpic,
  saveWorkspaceEpic,
  navigationCleanupEpic,
  disconnectFromDeviceEpic
);
