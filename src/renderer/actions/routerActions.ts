import { createAction } from '@reduxjs/toolkit';

export const RouterActions = {
  RouteChanged: createAction<string, 'ROUTE_CHANGED'>('ROUTE_CHANGED'),
} as const;
