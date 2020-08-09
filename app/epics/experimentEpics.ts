import { isActionOf } from 'typesafe-actions';
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
  tap
} from 'rxjs/operators';
import { ExperimentActions, ExperimentActionType } from '../actions';
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  CONNECTION_STATUS
} from '../constants/constants';
import { loadProtocol } from '../utils/labjs/functions';
import {
  createEEGWriteStream,
  writeHeader,
  writeEEGData
} from '../utils/filesystem/write';
import {
  getWorkspaceDir,
  storeExperimentState,
  restoreExperimentState,
  createWorkspaceDir,
  storeBehaviouralData,
  readWorkspaceBehaviorData
} from '../utils/filesystem/storage';
import { createEmotivRecord, stopEmotivRecord } from '../utils/eeg/emotiv';
import { RootState } from '../reducers';

// -------------------------------------------------------------------------
// Epics

const createNewWorkspaceEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = action$ =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.CreateNewWorkspace)),
    pluck('payload'),
    tap(workspaceInfo => createWorkspaceDir(workspaceInfo.title)),
    mergeMap(workspaceInfo =>
      of(
        ExperimentActions.SetType(workspaceInfo.type),
        ExperimentActions.SetParadigm(workspaceInfo.paradigm),
        ExperimentActions.SetTitle(workspaceInfo.title),
        ExperimentActions.LoadDefaultTimeline()
      )
    )
  );

const loadDefaultTimelineEpic = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.LoadDefaultTimeline)),
    map(() => state$.value.experiment.paradigm),
    map(loadProtocol),
    map(ExperimentActions.SetTimeline)
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
          .subscribe(eegData => writeEEGData(writeStream, eegData));
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
    map(({ payload }) => {
      if (!state$.value.experiment.title) {
        return;
      }
      storeBehaviouralData(
        payload.data,
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

// const setSubjectEpic = action$ =>
//   action$.pipe(filter(isActionOf(SET_SUBJECT).pipe(map(updateSession));
//
// const setGroupEpic = action$ =>
//   action$.pipe(filter(isActionOf(SET_GROUP).pipe(map(updateSession));

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
    map(behaviorFiles => {
      if (behaviorFiles.length > 0) {
        const subjectFiles = behaviorFiles.filter(filepath =>
          filepath.name.startsWith(state$.value.experiment.subject)
        );
        return subjectFiles.length + 1;
      }
      return 1;
    }),
    map(ExperimentActions.SetSession)
  );

const autoSaveEpic: Epic<any, ExperimentActionType, RootState> = action$ =>
  action$.ofType('@@router/LOCATION_CHANGE').pipe(
    pluck('payload', 'pathname'),
    filter(pathname => pathname !== '/' && pathname !== '/home'),
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
    map(() => getWorkspaceDir(state$.value.experiment.title!)),
    tap(() => storeExperimentState(state$.value.experiment)),
    ignoreElements()
  );

const navigationCleanupEpic: Epic<any, ExperimentActionType, RootState> = (
  action$,
  state$
) =>
  action$.ofType('@@router/LOCATION_CHANGE').pipe(
    pluck('payload', 'pathname'),
    filter(pathname => pathname === '/' || pathname === '/home'),
    tap(() => restoreExperimentState(state$.value.experiment)),
    map(ExperimentActions.ExperimentCleanup)
  );

export default combineEpics(
  loadDefaultTimelineEpic,
  createNewWorkspaceEpic,
  startEpic,
  experimentStopEpic, // setSubjectEpic,
  // setGroupEpic,
  updateSessionEpic,
  autoSaveEpic,
  saveWorkspaceEpic,
  navigationCleanupEpic
);
