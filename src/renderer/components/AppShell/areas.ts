import { SCREENS } from '../../constants/constants';
import { Area } from './types';

/** Routes outside any workspace. No workspace state is saved on these. */
export const HOME_ROUTE = '/';
export const BANK_ROUTE = '/home';
export const EXPLORE_ROUTE = '/explore';

/** The one place a workflow area maps to a router path. */
export const AREA_ROUTES: Record<Area, string> = {
  prepare: SCREENS.DESIGN.route,
  collect: SCREENS.COLLECT.route,
  clean: SCREENS.CLEAN.route,
  analyze: SCREENS.ANALYZE.route,
};

const BY_ROUTE = Object.entries(AREA_ROUTES) as [Area, string][];

export const areaForPath = (pathname: string): Area | undefined =>
  BY_ROUTE.find(([, route]) => route === pathname)?.[0];

/** True inside a workspace — the routes that save state and show the workflow. */
export const isWorkspaceRoute = (pathname: string): boolean =>
  areaForPath(pathname) !== undefined;
