import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import pyodide, { PyodideStateType } from './pyodideReducer';
import device, { DeviceStateType } from './deviceReducer';
import experiment, { ExperimentStateType } from './experimentReducer';

export interface RootState {
  pyodide: PyodideStateType;
  device: DeviceStateType;
  experiment: ExperimentStateType;
  router: any;
}

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    pyodide,
    device,
    experiment,
  });
}
