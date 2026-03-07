import { combineReducers } from 'redux';
import pyodide, { PyodideStateType } from './pyodideReducer';
import device, { DeviceStateType } from './deviceReducer';
import experiment, { ExperimentStateType } from './experimentReducer';

export interface RootState {
  pyodide: PyodideStateType;
  device: DeviceStateType;
  experiment: ExperimentStateType;
}

export default combineReducers({
  pyodide,
  device,
  experiment,
});
