import { combineEpics, Epic } from 'redux-observable';
import { from, of, ObservableInput } from 'rxjs';
import {
  map,
  mapTo,
  mergeMap,
  pluck,
  filter,
  takeUntil,
  throttleTime,
  ignoreElements,
  tap,
} from 'rxjs/operators';
import { isActionOf } from '../utils/redux';
import { ExperimentActions, ExperimentActionType } from '../actions';
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
    pluck<'payload', WorkSpaceInfo>('payload'),
    tap((workspaceInfo) => createWorkspaceDir(workspaceInfo.title)),
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
    map(() => {
      if (
        state$.value.device.connectionStatus === CONNECTION_STATUS.CONNECTED
      ) {
        const writeStream = createEEGWriteStream(
          state$.value.experiment.title,
          state$.value.experiment.subject,
          state$.value.experiment.group,
          state$.value.experiment.session
        );

        if (!writeStream) {
          return;
        }
        writeHeader(
          writeStream,
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
              action$.ofType(
                ExperimentActions.Stop.type,
                ExperimentActions.ExperimentCleanup.type
              )
            )
          )
          .subscribe((eegData) => writeEEGData(writeStream, eegData));
      }
    }),
    mapTo(true),
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
    pluck<'payload', { data: string }>('payload'),
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
      from(readWorkspaceBehaviorData(state$.value.experiment.title!))
    ),
    map((behaviorFiles) => {
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

const autoSaveEpic: Epic<any, ExperimentActionType, RootState> = (action$) =>
  action$.ofType('@@router/LOCATION_CHANGE').pipe(
    pluck('payload', 'pathname'),
    filter((pathname) => pathname !== '/' && pathname !== '/home'),
    map(ExperimentActions.SaveWorkspace)
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
    map(() => Date.now()),
    tap((now) =>
      storeExperimentState({ ...state$.value.experiment, dateModified: now })
    ),
    map(ExperimentActions.SetDateModified)
  );

const navigationCleanupEpic: Epic<any, ExperimentActionType, RootState> = (
  action$,
  state$
) =>
  action$.ofType('@@router/LOCATION_CHANGE').pipe(
    tap((pathname) => console.log('navigation', pathname)),
    pluck('payload', 'location', 'pathname'),
    tap((pathname) => console.log('navigation', pathname)),
    filter((pathname) => pathname === '/' || pathname === '/home'),
    map(ExperimentActions.ExperimentCleanup)
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
