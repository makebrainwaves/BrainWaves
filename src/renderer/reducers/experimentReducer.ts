import { createReducer } from '@reduxjs/toolkit';
import { ExperimentActions } from '../actions';
import type { RunOutcome } from '../actions/experimentActions';
import { EXPERIMENTS } from '../constants/constants';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../constants/interfaces';

export interface ExperimentStateType {
  // Type of experiment with readable string
  readonly type: EXPERIMENTS;
  readonly title: string;
  // Aspects of a study that can be tweaked within the BrainWaves app
  readonly params: ExperimentParameters | null;
  // lab.js study object that is executed by lab.js to render the study
  readonly experimentObject: ExperimentObject;
  // Subject/student name (e.g. Brian)
  readonly subject: string;
  // Classroom group name
  // TODO: Should this be optional?
  readonly group: string;
  // Session num. Each complete run through of the experiment is one session
  readonly session: number;
  readonly isRunning: boolean;
  readonly isEEGEnabled: boolean;
  readonly dateModified: number | null;
  /** End early was asked for; the runtime is unmounting and reporting its data. */
  readonly isEnding: boolean;
  /** Escape is held during a run; the RunBar says so. */
  readonly escapeHeld: boolean;
  /** How the last run ended; the first Stop of a run wins. Cleared by the next run. */
  readonly runOutcome: RunOutcome | null;
}

/** The live-run fields: never carried across runs or restored from disk. */
const idleRun = { isEnding: false, escapeHeld: false, runOutcome: null };

const initialState: ExperimentStateType = {
  type: EXPERIMENTS.NONE,
  title: '',
  params: null,
  experimentObject: {},
  subject: '',
  group: '',
  session: 1,
  isRunning: false,
  // EEG-on is the app's whole point; opt out for behavior-only runs, not in.
  isEEGEnabled: true,
  dateModified: null,
  ...idleRun,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(ExperimentActions.SetType, (state, action) => {
      return {
        ...state,
        type: action.payload,
      };
    })

    .addCase(ExperimentActions.SetExperimentObject, (state, action) => {
      return {
        ...state,
        experimentObject: action.payload,
      };
    })

    .addCase(ExperimentActions.SetSubject, (state, action) => {
      return {
        ...state,
        subject: action.payload,
      };
    })

    .addCase(ExperimentActions.SetGroup, (state, action) => {
      return {
        ...state,
        group: action.payload,
      };
    })

    .addCase(ExperimentActions.SetSession, (state, action) => {
      return {
        ...state,
        session: action.payload,
      };
    })

    .addCase(ExperimentActions.SetParams, (state, action) => {
      return {
        ...state,
        params: { ...state.params, ...action.payload },
      };
    })

    .addCase(ExperimentActions.SetDateModified, (state, action) => {
      return {
        ...state,
        dateModified: action.payload,
      };
    })

    .addCase(ExperimentActions.SetTitle, (state, action) => {
      return {
        ...state,
        title: action.payload,
      };
    })

    .addCase(ExperimentActions.SetIsRunning, (state, action) => ({
      ...state,
      isRunning: action.payload,
      isEnding: false,
      escapeHeld: false,
      runOutcome: action.payload ? null : state.runOutcome,
    }))

    .addCase(ExperimentActions.Stop, (state, action) =>
      state.isRunning && !state.runOutcome
        ? { ...state, runOutcome: action.payload.outcome }
        : state
    )

    .addCase(ExperimentActions.EndRun, (state) =>
      state.isRunning ? { ...state, isEnding: true, escapeHeld: false } : state
    )

    .addCase(ExperimentActions.SetEscapeHeld, (state, action) => ({
      ...state,
      escapeHeld: action.payload,
    }))

    .addCase(ExperimentActions.DismissRunResult, (state) => ({
      ...state,
      runOutcome: null,
    }))

    .addCase(ExperimentActions.SetEEGEnabled, (state, action) => {
      return {
        ...state,
        isEEGEnabled: action.payload,
      };
    })

    .addCase(ExperimentActions.SetState, (state, action) => ({
      ...state,
      ...action.payload,
      ...idleRun,
    }))

    .addCase(ExperimentActions.ExperimentCleanup, (state, action) => {
      return initialState;
    })
);
