// -------------------------------------------------------------------------
// Action Types

export const START = 'START';
export const PAUSE = 'PAUSE';
export const STOP = 'STOP';
export const SET_TYPE = 'SET_TYPE';
export const SET_PARADIGM = 'SET_PARADIGM';
export const SET_SUBJECT = 'SET_SUBJECT';
export const SET_GROUP = 'SET_GROUP';
export const CREATE_NEW_WORKSPACE = 'CREATE_NEW_WORKSPACE';
export const SET_SESSION = 'SET_SESSION';
export const SET_PARAMS = 'SET_PARAMS';
export const SET_DESCRIPTION = 'SET_DESCRIPTION';
export const LOAD_DEFAULT_TIMELINE = 'LOAD_DEFAULT_TIMELINE';
export const SET_TITLE = 'SET_TITLE';
export const SAVE_WORKSPACE = 'SAVE_WORKSPACE';
export const SET_EXPERIMENT_STATE = 'SET_EXPERIMENT_STATE';
export const SET_EEG_ENABLED = 'SET_EEG_ENABLED';

// -------------------------------------------------------------------------
// Actions

export const start = () => ({ type: START });
export const pause = () => ({ type: PAUSE });
// export const stop = () => ({ type: STOP });
export const stop = (payload) => ({ payload, type: STOP });
export const setType = (payload) => ({ payload, type: SET_TYPE });
export const setParadigm = (payload) => ({ payload, type: SET_PARADIGM });
export const setSubject = (payload) => ({ payload, type: SET_SUBJECT });
export const setGroup = (payload) => ({ payload, type: SET_GROUP });
export const setSession = (payload) => ({ payload, type: SET_SESSION });
export const setParams = (payload) => ({ payload, type: SET_PARAMS });
export const setDescription = (payload) => ({ payload, type: SET_DESCRIPTION });
export const createNewWorkspace = (payload) => ({
  payload,
  type: CREATE_NEW_WORKSPACE,
});
export const loadDefaultTimeline = () => ({ type: LOAD_DEFAULT_TIMELINE });
export const setTitle = (payload) => ({ payload, type: SET_TITLE });
export const saveWorkspace = () => ({ type: SAVE_WORKSPACE });
export const setState = (payload) => ({ payload, type: SET_EXPERIMENT_STATE });
export const setEEGEnabled = (payload) => ({ payload, type: SET_EEG_ENABLED });
