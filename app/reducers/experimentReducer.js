// @flow
import {
  SET_TIMELINE,
  SET_IS_RUNNING,
  SET_SESSION,
  EXPERIMENT_CLEANUP
} from '../epics/experimentEpics';
import {
  SET_TYPE,
  SET_SUBJECT,
  SET_TITLE,
  SET_EXPERIMENT_STATE,
  SET_PARAMS,
  SET_DESCRIPTION
} from '../actions/experimentActions';
import { EXPERIMENTS } from '../constants/constants';
import {
  MainTimeline,
  Trial,
  ActionType,
  ExperimentDescription,
  ExperimentParameters
} from '../constants/interfaces';

export interface ExperimentStateType {
  +type: ?EXPERIMENTS;
  +title: ?string;
  +params: ?ExperimentParameters;
  +mainTimeline: MainTimeline;
  +trials: { [string]: Trial };
  +timelines: {};
  +plugins: Object;
  +subject: string;
  +session: number;
  +isRunning: boolean;
  +description: ExperimentDescription;
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
  session: 1,
  isRunning: false,
  description: { question: '', hypothesis: '', methods: '' }
};

export default function experiment(
  state: ExperimentStateType = initialState,
  action: ActionType
) {
  switch (action.type) {
    case SET_TYPE:
      return {
        ...state,
        type: action.payload
      };

    case SET_SUBJECT:
      return {
        ...state,
        subject: action.payload
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
      console.log(action.payload);
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
