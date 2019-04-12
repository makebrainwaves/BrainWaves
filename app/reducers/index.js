// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import pyodide from './pyodideReducer';
import device from './deviceReducer';
import experiment from './experimentReducer';

const rootReducer = combineReducers({
  pyodide,
  device,
  experiment,
  router,
});

export default rootReducer;
