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

// TODO: create custom types for timeline and plugins
export type ExperimentStateType = {
  type: ?EXPERIMENTS,
  mainTimeline: ?MainTimeline,
  trials: ?Object<Trial>,
  timelines: ?Object<Timeline>,
  plugins: ?Object,
  subject: ?string,
  session: ?number,
  duration: ?number
};

const initialState = {
  type: null
};

export default function experiment(
  state: DeviceStateType = initialState,
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
