import { combineEpics } from 'redux-observable';
import jupyter from './jupyterEpics';
import device from './deviceEpics';
import experiment from './experimentEpics';

// TODO: Fix issue: https://github.com/piotrwitek/typesafe-actions/issues/174
export default combineEpics(jupyter, device, experiment);
