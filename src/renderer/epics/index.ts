import { combineEpics } from 'redux-observable';
import pyodide from './pyodideEpics';
import device from './deviceEpics';
import experiment from './experimentEpics';

export default combineEpics(device, experiment, pyodide);
