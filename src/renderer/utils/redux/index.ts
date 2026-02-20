import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';

export function isActionOf(actionCreator: ActionCreatorWithPayload<any, any>) {
  return (action: ActionType<any>) => action.type === actionCreator.type;
}
