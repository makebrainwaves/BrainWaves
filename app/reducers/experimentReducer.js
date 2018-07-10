// @flow
import { SET_TIMELINE } from "../epics/experimentEpics";
import { SET_TYPE } from "../actions/experimentActions";
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
}

const initialState = {
  type: null,
  mainTimeline: [],
  trials: {},
  timelines: {},
  plugins: {},
  subject: "",
  session: NaN,
  duration: NaN
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

    case SET_TIMELINE:
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}
