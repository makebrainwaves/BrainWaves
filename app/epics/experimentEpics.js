import { combineEpics } from "redux-observable";
import { from, of } from "rxjs";
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
} from "rxjs/operators";
import {
  setType,
  setParadigm,
  setTitle,
  saveWorkspace,
  loadDefaultTimeline,
  LOAD_DEFAULT_TIMELINE,
  START,
  STOP,
  SAVE_WORKSPACE,
  CREATE_NEW_WORKSPACE,
  SET_SUBJECT,
  SET_GROUP
} from "../actions/experimentActions";
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  CONNECTION_STATUS
} from "../constants/constants";
import { loadTimeline, getBehaviouralData } from "../utils/jspsych/functions";
import {
  createEEGWriteStream,
  writeHeader,
  writeEEGData
} from "../utils/filesystem/write";
import {
  getWorkspaceDir,
  storeExperimentState,
  createWorkspaceDir,
  storeBehaviouralData,
  readWorkspaceBehaviorData
} from "../utils/filesystem/storage";

import { createEmotivRecord, stopEmotivRecord } from "../utils/eeg/emotiv";

export const SET_TIMELINE = "SET_TIMELINE";
export const SET_IS_RUNNING = "SET_IS_RUNNING";
export const UPDATE_SESSION = "UPDATE_SESSION";
export const SET_SESSION = "SET_SESSION";
export const EXPERIMENT_CLEANUP = "EXPERIMENT_CLEANUP";

// -------------------------------------------------------------------------
// Action Creators

const setTimeline = payload => ({
  payload,
  type: SET_TIMELINE
});

const setIsRunning = payload => ({
  payload,
  type: SET_IS_RUNNING
});

const updateSession = () => ({ type: UPDATE_SESSION });

const setSession = payload => ({
  payload,
  type: SET_SESSION
});

const cleanup = () => ({
  type: EXPERIMENT_CLEANUP
});

// -------------------------------------------------------------------------
// Epics

const createNewWorkspaceEpic = action$ =>
  action$.ofType(CREATE_NEW_WORKSPACE).pipe(
    pluck("payload"),
    tap(workspaceInfo => createWorkspaceDir(workspaceInfo.title)),
    mergeMap(workspaceInfo =>
      of(
        setType(workspaceInfo.type),
        setParadigm(workspaceInfo.paradigm),
        setTitle(workspaceInfo.title),
        loadDefaultTimeline()
      )
    )
  );

const loadDefaultTimelineEpic = (action$, state$) =>
  action$.ofType(LOAD_DEFAULT_TIMELINE).pipe(
    map(() => state$.value.experiment.paradigm),
    map(loadTimeline),
    map(setTimeline)
  );

const startEpic = (action$, state$) =>
  action$.ofType(START).pipe(
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
          .pipe(takeUntil(action$.ofType(STOP, EXPERIMENT_CLEANUP)))
          .subscribe(eegData => writeEEGData(writeStream, eegData));
      }
    }),
    mapTo(true),
    map(setIsRunning)
  );

const experimentStopEpic = (action$, state$) =>
  action$.ofType(STOP).pipe(
    filter(() => state$.value.experiment.isRunning),
    map(({ payload }) => {
      storeBehaviouralData(
        payload.data,
        state$.value.experiment.title,
        state$.value.experiment.subject,
        state$.value.experiment.group,
        state$.value.experiment.session
      );
      if (state$.value && state$.value.device && state$.value.device.deviceType && state$.value.device.deviceType === DEVICES.EMOTIV) {
        stopEmotivRecord();
      }
    }),
    mergeMap(() => of(setIsRunning(false), updateSession()))
  );

const setSubjectEpic = action$ =>
  action$.ofType(SET_SUBJECT).pipe(map(updateSession));

const setGroupEpic = action$ =>
  action$.ofType(SET_GROUP).pipe(map(updateSession));

const updateSessionEpic = (action$, state$) =>
  action$.ofType(UPDATE_SESSION).pipe(
    mergeMap(() =>
      from(readWorkspaceBehaviorData(state$.value.experiment.title))
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
    map(setSession)
  );

const autoSaveEpic = action$ =>
  action$.ofType("@@router/LOCATION_CHANGE").pipe(
    pluck("payload", "pathname"),
    filter(pathname => pathname !== "/"),
    map(saveWorkspace)
  );

const saveWorkspaceEpic = (action$, state$) =>
  action$.ofType(SAVE_WORKSPACE).pipe(
    throttleTime(1000),
    filter(() => state$.value.experiment.title.length > 1),
    map(() => getWorkspaceDir(state$.value.experiment.title)),
    tap(() => storeExperimentState(state$.value.experiment)),
    ignoreElements()
  );

const navigationCleanupEpic = action$ =>
  action$.ofType("@@router/LOCATION_CHANGE").pipe(
    pluck("payload", "pathname"),
    filter(pathname => pathname === "/"),
    map(cleanup)
  );

export default combineEpics(
  loadDefaultTimelineEpic,
  createNewWorkspaceEpic,
  startEpic,
  experimentStopEpic,
  setSubjectEpic,
  setGroupEpic,
  updateSessionEpic,
  autoSaveEpic,
  saveWorkspaceEpic,
  navigationCleanupEpic
);
