import { combineEpics } from "redux-observable";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { map, mapTo, tap, pluck, filter, takeUntil } from "rxjs/operators";
import { isNil } from "lodash";
import {
  LOAD_DEFAULT_TIMELINE,
  START,
  STOP,
  stop
} from "../actions/experimentActions";
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS
} from "../constants/constants";
import { loadTimeline } from "../utils/jspsych/functions";
import { injectMuseMarker } from "../utils/muse";
import { injectEmotivMarker } from "../utils/emotiv";
import { writeHeader, writeEEGData } from "../utils/filesystem/write";

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

const loadDefaultTimelineEpic = (action$, store) =>
  action$.ofType(LOAD_DEFAULT_TIMELINE).pipe(
    map(() => store.getState().experiment.type),
    map(loadTimeline),
    map(setTimeline)
  );

const startEpic = (action$, store) =>
  action$.ofType(START).pipe(
    filter(
      () =>
        !store.getState().experiment.isRunning &&
        store.getState().experiment.subject !== "" &&
        !isNil(store.getState().device.rawObservable)
    ),
    map(() => {
      const writeStream = fs.createWriteStream(
        path.join(
          os.homedir(),
          "BrainWaves Data",
          store.getState().experiment.type,
          `${store.getState().experiment.subject}_${
            store.getState().experiment.session
          }.csv`
        )
      );

      writeHeader(
        writeStream,
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS
          : MUSE_CHANNELS
      );
      store
        .getState()
        .device.rawObservable.pipe(
          takeUntil(action$.ofType(STOP, EXPERIMENT_CLEANUP))
        )
        .subscribe(eegData => writeEEGData(writeStream, eegData));
    }),
    mapTo(true),
    map(setIsRunning)
  );

const sessionCountEpic = (action$, store) =>
  action$
    .ofType(STOP)
    .pipe(map(() => setSession(store.getState().experiment.session + 1)));

const navigationCleanupEpic = action$ =>
  action$.ofType("@@router/LOCATION_CHANGE").pipe(
    pluck("payload", "pathname"),
    filter(pathname => pathname === "/"),
    map(cleanup)
  );

export default combineEpics(
  loadDefaultTimelineEpic,
  startEpic,
  sessionCountEpic,
  navigationCleanupEpic
);
