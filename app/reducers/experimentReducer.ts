import { createReducer } from '@reduxjs/toolkit';
import { ExperimentActions } from '../actions';
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
}

const initialState: ExperimentStateType = {
  type: EXPERIMENTS.NONE,
  title: '',
  params: null,
  experimentObject: {},
  subject: '',
  group: '',
  session: 1,
  isRunning: false,
  isEEGEnabled: false,
  dateModified: null,
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

    .addCase(ExperimentActions.SetIsRunning, (state, action) => {
      return {
        ...state,
        isRunning: action.payload,
      };
    })

    .addCase(ExperimentActions.SetEEGEnabled, (state, action) => {
      return {
        ...state,
        isEEGEnabled: action.payload,
      };
    })

    .addCase(
      ExperimentActions.ExperimentCleanup,
      (state, action) => initialState
    )
);
