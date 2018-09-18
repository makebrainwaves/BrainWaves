import { combineEpics } from "redux-observable";
import { executeRequest } from "@nteract/messaging";
import { of } from "rxjs";
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
  setTitle,
  saveWorkspace,
  loadDefaultTimeline,
  LOAD_DEFAULT_TIMELINE,
  START,
  STOP,
  SAVE_WORKSPACE,
  CREATE_NEW_WORKSPACE
} from "../actions/experimentActions";
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  KERNEL_STATUS
} from "../constants/constants";
import { loadTimeline, getBehaviouralData } from "../utils/jspsych/functions";
import {
  createEEGWriteStream,
  writeHeader,
  writeEEGData
} from "../utils/filesystem/write";
import {
  storeExperimentState,
  createWorkspaceDir
} from "../utils/filesystem/storage";
import { saveEpochs } from "../utils/jupyter/cells";

export const SET_TIMELINE = "LOAD_TIMELINE";
export const SET_IS_RUNNING = "SET_IS_RUNNING";
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

const setSession = payload => ({
  payload,
  type: SET_SESSION
});

const cleanup = () => ({
  type: EXPERIMENT_CLEANUP
});

// -------------------------------------------------------------------------
// Epics

const createNewWorkspaceEpic = (action$, state$) =>
  action$.ofType(CREATE_NEW_WORKSPACE).pipe(
    pluck("payload"),
    tap(workspaceInfo => createWorkspaceDir(workspaceInfo.title)),
    mergeMap(workspaceInfo => {
      return of(
        setType(workspaceInfo.type),
        setTitle(workspaceInfo.title),
        loadDefaultTimeline(),
        saveWorkspace()
      );
    })
  );

const loadDefaultTimelineEpic = (action$, state$) =>
  action$.ofType(LOAD_DEFAULT_TIMELINE).pipe(
    map(() => state$.value.experiment.type),
    map(loadTimeline),
    map(setTimeline)
  );

const startEpic = (action$, state$) =>
  action$.ofType(START).pipe(
    filter(
      () =>
        !state$.value.experiment.isRunning &&
        state$.value.device.rawObservable &&
        state$.value.experiment.subject !== ""
    ),
    map(() => {
      const writeStream = createEEGWriteStream(
        state$.value.experiment.title,
        state$.value.experiment.subject,
        state$.value.experiment.session
      );

      writeHeader(
        writeStream,
        state$.value.device.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS
          : MUSE_CHANNELS
      );
      state$.value.device.rawObservable
        .pipe(takeUntil(action$.ofType(STOP, EXPERIMENT_CLEANUP)))
        .subscribe(eegData => writeEEGData(writeStream, eegData));
    }),
    mapTo(true),
    map(setIsRunning)
  );

const experimentStopEpic = action$ =>
  action$.ofType(STOP).pipe(
    map(getBehaviouralData),  
    tap(console.log),
    map(() => setIsRunning(false))
  );

const sessionCountEpic = (action$, state$) =>
  action$.ofType(STOP).pipe(
    filter(() => state$.value.experiment.isRunning),
    map(() => setSession(state$.value.experiment.session + 1))
  );

const saveWorkspaceEpic = (action$, state$) =>
  action$.ofType(SAVE_WORKSPACE).pipe(
    throttleTime(1000),
    map(() => storeExperimentState(state$.value.experiment)),
    tap(dir => {
      if (
        state$.value.jupyter.epochsInfo &&
        state$.value.jupyter.kernelStatus === KERNEL_STATUS.IDLE
      ) {
        state$.value.jupyter.mainChannel.next(executeRequest(saveEpochs(dir)));
      }
    }),
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
  sessionCountEpic,
  saveWorkspaceEpic,
  navigationCleanupEpic
);
