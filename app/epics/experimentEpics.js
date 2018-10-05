import { combineEpics } from 'redux-observable';
import { executeRequest } from '@nteract/messaging';
import { from, of } from 'rxjs';
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
import {
  setType,
  setTitle,
  saveWorkspace,
  loadDefaultTimeline,
  LOAD_DEFAULT_TIMELINE,
  START,
  STOP,
  SAVE_WORKSPACE,
  CREATE_NEW_WORKSPACE,
  SET_SUBJECT
} from '../actions/experimentActions';
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  KERNEL_STATUS
} from '../constants/constants';
import { loadTimeline, getBehaviouralData } from '../utils/jspsych/functions';
import {
  createEEGWriteStream,
  writeHeader,
  writeEEGData
} from '../utils/filesystem/write';
import {
  getWorkspaceDir,
  storeExperimentState,
  createWorkspaceDir,
  storeBehaviouralData,
  readWorkspaceRawEEGData
} from '../utils/filesystem/storage';
import { saveEpochs } from '../utils/jupyter/cells';

export const SET_TIMELINE = 'SET_TIMELINE';
export const SET_IS_RUNNING = 'SET_IS_RUNNING';
export const UPDATE_SESSION = 'UPDATE_SESSION';
export const SET_SESSION = 'SET_SESSION';
export const EXPERIMENT_CLEANUP = 'EXPERIMENT_CLEANUP';

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
    pluck('payload'),
    tap(workspaceInfo => createWorkspaceDir(workspaceInfo.title)),
    mergeMap(workspaceInfo =>
      of(
        setType(workspaceInfo.type),
        setTitle(workspaceInfo.title),
        loadDefaultTimeline()
      )
    )
  );

const loadDefaultTimelineEpic = (action$, state$) =>
  action$.ofType(LOAD_DEFAULT_TIMELINE).pipe(
    map(() => state$.value.experiment.type),
    map(loadTimeline),
    map(setTimeline)
  );

const startEpic = (action$, state$) =>
  action$.ofType(START).pipe(
    tap(console.log),
    filter(
      () =>
        !state$.value.experiment.isRunning && state$.value.device.rawObservable
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

const experimentStopEpic = (action$, state$) =>
  action$.ofType(STOP).pipe(
    map(getBehaviouralData),
    map(csv =>
      storeBehaviouralData(
        csv,
        state$.value.experiment.title,
        state$.value.experiment.subject,
        state$.value.experiment.session
      )
    ),
    mergeMap(() => of(setIsRunning(false), updateSession()))
  );

const setSubjectEpic = action$ =>
  action$.ofType(SET_SUBJECT).pipe(map(updateSession));

// TODO: Refactor this to use redux-observable state stream
const updateSessionEpic = (action$, state$) =>
  action$.ofType(UPDATE_SESSION).pipe(
    mergeMap(() =>
      from(readWorkspaceRawEEGData(state$.value.experiment.title))
    ),
    map(rawFiles => {
      if (rawFiles.length > 0) {
        const subjectFiles = rawFiles.filter(
          filepath =>
            filepath.name.slice(0, filepath.name.length - 10) ===
            state$.value.experiment.subject
        );
        console.log(subjectFiles.length + 1);
        return subjectFiles.length + 1;
      }
      return 1;
    }),
    map(setSession)
  );

// const sessionCountEpic = (action$, state$) =>
//   action$.ofType(STOP).pipe(
//     filter(() => state$.value.experiment.isRunning),
//     map(() => setSession(state$.value.experiment.session + 1))
//   );

const autoSaveEpic = action$ =>
  action$.ofType(SET_TIMELINE).pipe(map(saveWorkspace));

const saveWorkspaceEpic = (action$, state$) =>
  action$.ofType(SAVE_WORKSPACE).pipe(
    throttleTime(1000),
    filter(() => state$.value.experiment.title.length > 1),
    map(() => getWorkspaceDir(state$.value.experiment.title)),
    tap(() => storeExperimentState(state$.value.experiment)),
    tap(dir => {
      if (
        state$.value.jupyter.epochsInfo &&
        state$.value.jupyter.kernelStatus === KERNEL_STATUS.IDLE
      ) {
        console.log('passed epoch save criteria');
        state$.value.jupyter.mainChannel.next(
          executeRequest(
            saveEpochs(
              dir,
              state$.value.experiment.subject,
              state$.value.experiment.session
            )
          )
        );
      }
    }),
    ignoreElements()
  );

const navigationCleanupEpic = action$ =>
  action$.ofType('@@router/LOCATION_CHANGE').pipe(
    pluck('payload', 'pathname'),
    filter(pathname => pathname === '/'),
    map(cleanup)
  );

export default combineEpics(
  loadDefaultTimelineEpic,
  createNewWorkspaceEpic,
  startEpic,
  experimentStopEpic,
  setSubjectEpic,
  updateSessionEpic,
  autoSaveEpic,
  saveWorkspaceEpic,
  navigationCleanupEpic
);
