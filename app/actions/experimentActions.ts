import { createAction } from '@reduxjs/toolkit';

// -------------------------------------------------------------------------
// Actions

export const ExperimentActions = {
  Start: createAction<any, 'Start'>('Start'),
  Pause: createAction<any, 'Pause'>('Pause'),
  Stop: createAction<any, 'STOP'>('STOP'),
  SetType: createAction<any, 'SET_TYPE'>('SET_TYPE'),
  SetParadigm: createAction<any, 'SET_PARADIGM'>('SET_PARADIGM'),
  SetSubject: createAction<any, 'SET_SUBJECT'>('SET_SUBJECT'),
  SetGroup: createAction<any, 'SET_GROUP'>('SET_GROUP'),
  SetSession: createAction<any, 'SET_SESSION'>('SET_SESSION'),
  SetParams: createAction<any, 'SET_PARAMS'>('SET_PARAMS'),
  SetDescription: createAction<any, 'SET_DESCRIPTION'>('SET_DESCRIPTION'),
  CreateNewWorkspace: createAction<any, 'CREATE_NEW_WORKSPACE'>(
    'CREATE_NEW_WORKSPACE'
  ),
  LoadDefaultTimeline: createAction<any, 'LOAD_DEFAULT_TIMELINE'>(
    'LOAD_DEFAULT_TIMELINE'
  ),
  SetTitle: createAction<any, 'SET_TITLE'>('SET_TITLE'),
  SaveWorkspace: createAction<any, 'SAVE_WORKSPACE'>('SAVE_WORKSPACE'),
  SetState: createAction<any, 'SET_EXPERIMENT_STATE'>('SET_EXPERIMENT_STATE'),
  SetEEGEnabled: createAction<any, 'SET_EEG_ENABLED'>('SET_EEG_ENABLED')
};
