import { combineEpics } from 'redux-observable';
import pyodide from './pyodideEpics';
import device from './deviceEpics';
import experiment from './experimentEpics';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default combineEpics(device as any, experiment as any, pyodide as any); // mixed action types across epics require any for combineEpics
