// @flow
import {} from "../epics/experimentEpics";
import { SET_TYPE } from "../actions/experimentActions";
import { EXPERIMENTS } from "../constants/constants";

// TODO: create custom types for timeline and plugins
export type experimentStateType = {
  type: ?EXPERIMENTS,
  dir: ?string,
  timeline: ?Array,
  plugins: ?Object,
  subject: ?string,
  session: ?number,
  duration: ?number
};

type actionType = {
  +payload: any,
  +type: string
};

const initialState = {
  type: null,
  dir: null,
  timeline: null,
  plugins: null,
  subject: null,
  session: null,
  duration: null
};

export default function experiment(
  state: deviceStateType = initialState,
  action: actionType
) {
  switch (action.type) {
    case SET_TYPE:
      return {
        ...state,
        type: action.payload
      };

    default:
      return state;
  }
}
