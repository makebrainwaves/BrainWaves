import { createAction } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';

// -------------------------------------------------------------------------
// Actions

export const ExperimentActions = {
  Start: createAction('START'),
  Pause: createAction('PAUSE'),
  Stop: createAction<{ data: string }, 'STOP'>('STOP'),
  SetType: createAction<any, 'SET_TYPE'>('SET_TYPE'),
  SetParadigm: createAction<any, 'SET_PARADIGM'>('SET_PARADIGM'),
  SetSubject: createAction<any, 'SET_SUBJECT'>('SET_SUBJECT'),
  SetGroup: createAction<any, 'SET_GROUP'>('SET_GROUP'),
  SetSession: createAction<any, 'SET_SESSION'>('SET_SESSION'),
  SetParams: createAction<any, 'SET_PARAMS'>('SET_PARAMS'),
  SetDateModified: createAction<number, 'SET_DATE_MODIFIED'>(
    'SET_DATE_MODIFIED'
  ),
  SetDescription: createAction<any, 'SET_DESCRIPTION'>('SET_DESCRIPTION'),
  CreateNewWorkspace: createAction<any, 'CREATE_NEW_WORKSPACE'>(
    'CREATE_NEW_WORKSPACE'
  ),
  LoadDefaultTimeline: createAction('LOAD_DEFAULT_TIMELINE'),
  SetIsRunning: createAction<boolean, 'SET_IS_RUNNING'>('SET_IS_RUNNING'),
  SetExperimentState: createAction<any, 'SET_EXPERIMENT_STATE'>(
    'SET_EXPERIMENT_STATE'
  ),
  ExperimentCleanup: createAction('EXPERIMENT_CLEANUP'),
  SetTimeline: createAction<any, 'SET_TIMELINE'>('SET_TIMELINE'),
  SetTitle: createAction<any, 'SET_TITLE'>('SET_TITLE'),
  SaveWorkspace: createAction('SAVE_WORKSPACE'),
  SetState: createAction<any, 'SET_EXPERIMENT_STATE'>('SET_EXPERIMENT_STATE'),
  SetEEGEnabled: createAction<any, 'SET_EEG_ENABLED'>('SET_EEG_ENABLED'),
  UpdateSession: createAction('UPDATE_SESSION'),
} as const;

export type ExperimentActionType = ActionType<
  typeof ExperimentActions[keyof typeof ExperimentActions]
>;
