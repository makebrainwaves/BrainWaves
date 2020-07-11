import { createReducer } from '@reduxjs/toolkit';
import { ExperimentActions } from '../actions/experimentActions';
import { EXPERIMENTS } from '../constants/constants';
import {
  MainTimeline,
  Trial,
  ExperimentDescription,
  ExperimentParameters
} from '../constants/interfaces';

export interface ExperimentStateType {
  readonly type: EXPERIMENTS | null | undefined;
  readonly title: string | null | undefined;
  readonly params: ExperimentParameters | null | undefined;
  readonly mainTimeline: MainTimeline;
  readonly trials: {
    [key: string]: Trial;
  };
  readonly timelines: {};
  readonly plugins: object;
  readonly subject: string;
  readonly group: string;
  readonly session: number;
  readonly isRunning: boolean;
  readonly isEEGEnabled: boolean;
  readonly description: ExperimentDescription;
}

const initialState: ExperimentStateType = {
  type: EXPERIMENTS.NONE,
  title: '',
  params: null,
  mainTimeline: [],
  trials: {},
  timelines: {},
  plugins: {},
  subject: '',
  group: '',
  session: 1,
  isRunning: false,
  isEEGEnabled: false,
  description: { question: '', hypothesis: '', methods: '' }
};

export default createReducer(initialState, builder =>
  builder
    .addCase(ExperimentActions.SetType, (state, action) => {
      return {
        ...state,
        type: action.payload
      };
    })

    .addCase(ExperimentActions.SetParadigm, (state, action) => {
      return {
        ...state,
        paradigm: action.payload
      };
    })

    .addCase(ExperimentActions.SetSubject, (state, action) => {
      return {
        ...state,
        subject: action.payload
      };
    })

    .addCase(ExperimentActions.SetGroup, (state, action) => {
      return {
        ...state,
        group: action.payload
      };
    })

    .addCase(ExperimentActions.SetSession, (state, action) => {
      return {
        ...state,
        session: action.payload
      };
    })

    .addCase(ExperimentActions.SetParams, (state, action) => {
      return {
        ...state,
        params: { ...state.params, ...action.payload }
      };
    })

    .addCase(ExperimentActions.SetTimeline, (state, action) => {
      return {
        ...state,
        ...action.payload
      };
    })

    .addCase(ExperimentActions.SetTitle, (state, action) => {
      return {
        ...state,
        title: action.payload
      };
    })

    .addCase(ExperimentActions.SetDescription, (state, action) => {
      return {
        ...state,
        description: action.payload
      };
    })

    .addCase(ExperimentActions.SetIsRunning, (state, action) => {
      return {
        ...state,
        isRunning: action.payload
      };
    })

    .addCase(ExperimentActions.SetEEGEnabled, (state, action) => {
      return {
        ...state,
        isEEGEnabled: action.payload
      };
    })

    .addCase(ExperimentActions.SetExperimentState, (state, action) => {
      return {
        ...action.payload
      };
    })
    .addCase(
      ExperimentActions.ExperimentCleanup,
      (state, action) => initialState
    )
);
