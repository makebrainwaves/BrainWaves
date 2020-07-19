import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import jupyter, { JupyterStateType } from './jupyterReducer';
import device, { DeviceStateType } from './deviceReducer';
import experiment, { ExperimentStateType } from './experimentReducer';

export interface RootState {
  jupyter: JupyterStateType;
  device: DeviceStateType;
  experiment: ExperimentStateType;
  router: unknown;
}

const rootReducer = combineReducers({
  jupyter,
  device,
  experiment,
  router
});

export default rootReducer;
