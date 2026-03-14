import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { ActionType } from 'typesafe-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isActionOf(actionCreator: ActionCreatorWithPayload<any, any>) {
  // generic action creator utility — payload/type args are runtime-dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (action: ActionType<any>) => action.type === actionCreator.type; // typesafe-actions ActionType requires any generic here
}
