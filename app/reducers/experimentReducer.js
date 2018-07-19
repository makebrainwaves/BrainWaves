// @flow
import {
  SET_TIMELINE,
  SET_IS_RUNNING,
  SET_SESSION
} from "../epics/experimentEpics";
import { SET_TYPE, SET_SUBJECT } from "../actions/experimentActions";
import { EXPERIMENTS } from "../constants/constants";
import {
  MainTimeline,
  Trial,
  Timeline,
  ActionType
} from "../constants/interfaces";

interface ExperimentStateType {
  type: ?EXPERIMENTS;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  plugins: Object;
  subject: string;
  session: number;
  duration: number;
  isRunning: boolean;
}

const initialState = {
  type: EXPERIMENTS.N170,
  mainTimeline: [],
  trials: {},
  timelines: {},
  plugins: {},
  subject: "",
  session: 1,
  duration: NaN,
  isRunning: false
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

    case SET_TIMELINE:
      return {
        ...state,
        ...action.payload
      };

    case SET_IS_RUNNING:
      return {
        ...state,
        isRunning: action.payload
      };

    default:
      return state;
  }
}
