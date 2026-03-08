import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ExperimentActions } from '../actions';

/**
 * Dispatches ExperimentActions.RouteChanged whenever the route changes.
 * This replaces the connected-react-router @@router/LOCATION_CHANGE action
 * so epics can react to navigation without depending on the router reducer.
 */
export default function RouteChangeTracker() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(ExperimentActions.RouteChanged(location.pathname));
  }, [location.pathname, dispatch]);

  return null;
}
