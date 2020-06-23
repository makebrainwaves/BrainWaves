
import { SET_TIMELINE, SET_IS_RUNNING, SET_SESSION, EXPERIMENT_CLEANUP } from "../epics/experimentEpics";
import { SET_TYPE, SET_PARADIGM, SET_SUBJECT, SET_GROUP, SET_TITLE, SET_EXPERIMENT_STATE, SET_PARAMS, SET_DESCRIPTION, SET_EEG_ENABLED } from "../actions/experimentActions";
import { EXPERIMENTS } from "../constants/constants";
import { MainTimeline, Trial, ActionType, ExperimentDescription, ExperimentParameters } from "../constants/interfaces";

export interface ExperimentStateType {
  readonly type: EXPERIMENTS | null | undefined;
  readonly title: string | null | undefined;
  readonly params: ExperimentParameters | null | undefined;
  readonly mainTimeline: MainTimeline;
  readonly trials: {
    [key: string]: Trial;
  };
  readonly timelines: {};
  readonly plugins: Object;
  readonly subject: string;
  readonly group: string;
  readonly session: number;
  readonly isRunning: boolean;
  readonly isEEGEnabled: boolean;
  readonly description: ExperimentDescription;
}

const initialState = {
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

export default function experiment(state: ExperimentStateType = initialState, action: ActionType) {
  switch (action.type) {
    case SET_TYPE:
      return {
        ...state,
        type: action.payload
      };

    case SET_PARADIGM:
      return {
        ...state,
        paradigm: action.payload
      };

    case SET_SUBJECT:
      return {
        ...state,
        subject: action.payload
      };

    case SET_GROUP:
      return {
        ...state,
        group: action.payload
      };

    case SET_SESSION:
      return {
        ...state,
        session: action.payload
      };

    case SET_PARAMS:
      return {
        ...state,
        params: { ...state.params, ...action.payload }
      };

    case SET_TIMELINE:
      return {
        ...state,
        ...action.payload
      };

    case SET_TITLE:
      return {
        ...state,
        title: action.payload
      };

    case SET_DESCRIPTION:
      return {
        ...state,
        description: action.payload
      };

    case SET_IS_RUNNING:
      return {
        ...state,
        isRunning: action.payload
      };

    case SET_EEG_ENABLED:
      return {
        ...state,
        isEEGEnabled: action.payload
      };

    case SET_EXPERIMENT_STATE:
      return {
        ...action.payload
      };

    case EXPERIMENT_CLEANUP:
      return initialState;

    default:
      return state;

  }
}