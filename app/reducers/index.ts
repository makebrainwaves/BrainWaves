import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import jupyter, { JupyterStateType } from './jupyterReducer';
import device, { DeviceStateType } from './deviceReducer';
import experiment, { ExperimentStateType } from './experimentReducer';

export interface RootState {
  jupyter: JupyterStateType;
  device: DeviceStateType;
  experiment: ExperimentStateType;
  router: any;
}

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    jupyter,
    device,
    experiment,
  });
}
