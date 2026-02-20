import { createAction } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';
import { EXPERIMENTS } from '../constants/constants';
import {
  ExperimentObject,
  ExperimentParameters,
  WorkSpaceInfo,
} from '../constants/interfaces';
import { ExperimentStateType } from '../reducers/experimentReducer';

// -------------------------------------------------------------------------
// Actions

export const ExperimentActions = {
  Start: createAction('START'),
  Pause: createAction('PAUSE'),
  Stop: createAction<{ data: string }, 'STOP'>('STOP'),
  SetType: createAction<EXPERIMENTS, 'SET_TYPE'>('SET_TYPE'),
  SetExperimentObject: createAction<ExperimentObject, 'SET_EXPERIMENT_OBJECT'>(
    'SET_EXPERIMENT_OBJECT'
  ),
  SetSubject: createAction<string, 'SET_SUBJECT'>('SET_SUBJECT'),
  SetGroup: createAction<string, 'SET_GROUP'>('SET_GROUP'),
  SetSession: createAction<number, 'SET_SESSION'>('SET_SESSION'),
  SetParams: createAction<ExperimentParameters, 'SET_PARAMS'>('SET_PARAMS'),
  SetDateModified: createAction<number, 'SET_DATE_MODIFIED'>(
    'SET_DATE_MODIFIED'
  ),
  CreateNewWorkspace: createAction<WorkSpaceInfo, 'CREATE_NEW_WORKSPACE'>(
    'CREATE_NEW_WORKSPACE'
  ),
  SetIsRunning: createAction<boolean, 'SET_IS_RUNNING'>('SET_IS_RUNNING'),
  ExperimentCleanup: createAction('EXPERIMENT_CLEANUP'),
  SetTitle: createAction<string, 'SET_TITLE'>('SET_TITLE'),
  SaveWorkspace: createAction('SAVE_WORKSPACE'),
  SetState: createAction<ExperimentStateType, 'SET_EXPERIMENT_STATE'>(
    'SET_EXPERIMENT_STATE'
  ),
  SetEEGEnabled: createAction<boolean, 'SET_EEG_ENABLED'>('SET_EEG_ENABLED'),
  UpdateSession: createAction('UPDATE_SESSION'),
} as const;

export type ExperimentActionType = ActionType<
  typeof ExperimentActions[keyof typeof ExperimentActions]
>;
