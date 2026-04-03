import { combineEpics, Epic, ofType } from 'redux-observable';
import { from, of } from 'rxjs';
import {
  map,
  mergeMap,
  filter,
  takeUntil,
  throttleTime,
  tap,
} from 'rxjs/operators';
import { isActionOf } from '../utils/redux';
import { ExperimentActions, ExperimentActionType } from '../actions';
import { RouterActions } from '../actions/routerActions';
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  CONNECTION_STATUS,
} from '../constants/constants';
import {
  createEEGWriteStream,
  writeHeader,
  writeEEGData,
} from '../utils/filesystem/write';
import {
  storeExperimentState,
  restoreExperimentState,
  createWorkspaceDir,
  storeBehavioralData,
  readWorkspaceBehaviorData,
  getWorkspaceDir,
} from '../utils/filesystem/storage';
import { createEmotivRecord, stopEmotivRecord } from '../utils/eeg/emotiv';
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
    mergeMap((workspaceInfo) => {
      const experiment = getExperimentFromType(workspaceInfo.type);
      return of(
        ExperimentActions.SetTitle(workspaceInfo.title),
        ExperimentActions.SetType(workspaceInfo.type),
        ExperimentActions.SetExperimentObject(experiment?.experimentObject),
        ExperimentActions.SetParams(experiment?.params)
      );
    })
  );

const startEpic = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.Start)),
    filter(() => !state$.value.experiment.isRunning),
    mergeMap(async () => {
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
        writeHeader(
          streamId,
          state$.value.device.deviceType === DEVICES.EMOTIV
            ? EMOTIV_CHANNELS
            : MUSE_CHANNELS
        );

        if (state$.value.device.deviceType === DEVICES.EMOTIV) {
          createEmotivRecord(
            state$.value.experiment.subject,
            state$.value.experiment.session
          );
        }

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

const experimentStopEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.Stop)),
    filter(() => state$.value.experiment.isRunning),
    map((action) => action.payload as { data: string }),
    map(({ data }) => {
      if (!state$.value.experiment.title) {
        return;
      }
      storeBehavioralData(
        data,
        state$.value.experiment.title,
        state$.value.experiment.subject,
        state$.value.experiment.group,
        state$.value.experiment.session
      );
      if (
        state$.value.experiment.isEEGEnabled &&
        state$.value.device.deviceType === DEVICES.EMOTIV
      ) {
        stopEmotivRecord();
      }
    }),
    mergeMap(() => of(ExperimentActions.SetIsRunning(false)))
  );

const updateSessionEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.UpdateSession)),
    mergeMap(() =>
      from(
        readWorkspaceBehaviorData(state$.value.experiment.title!) as Promise<
          { name: string; path: string }[]
        >
      )
    ),
    map((behaviorFiles: { name: string; path: string }[]) => {
      if (behaviorFiles.length > 0) {
        const subjectFiles = behaviorFiles.filter((filepath) =>
          filepath.name.startsWith(state$.value.experiment.subject)
        );
        return subjectFiles.length + 1;
      }
      return 1;
    }),
    map(ExperimentActions.SetSession)
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const autoSaveEpic: Epic<any, ExperimentActionType, RootState> = (
  action$ // RouterActions union requires any here
) =>
  action$.pipe(
    filter(isActionOf(RouterActions.RouteChanged)),
    map((action) => action.payload as string),
    filter((pathname) => pathname !== '/' && pathname !== '/home'),
    map(() => ExperimentActions.SaveWorkspace())
  );

const saveWorkspaceEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.SaveWorkspace)),
    throttleTime(1000),
    filter(() =>
      state$.value.experiment.title
        ? state$.value.experiment.title.length > 1
        : false
    ),
    mergeMap(async () => {
      const now = Date.now();
      // experimentObject contains function references (hooks) that cannot be
      // serialized via IPC structured clone. It is always re-derived from
      // `type` on load (see handleLoadRecentWorkspace), so omit it here.
      const { experimentObject: _omit, ...serializableState } =
        state$.value.experiment;
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
    filter((pathname) => pathname === '/' || pathname === '/home'),
    map(() => ExperimentActions.ExperimentCleanup())
  );

export default combineEpics(
  createNewWorkspaceEpic,
  startEpic,
  experimentStopEpic,
  updateSessionEpic,
  autoSaveEpic,
  saveWorkspaceEpic,
  navigationCleanupEpic
);
