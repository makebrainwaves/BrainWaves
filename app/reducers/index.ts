import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import jupyter from './jupyterReducer';
import device from './deviceReducer';
import experiment from './experimentReducer';

const rootReducer = combineReducers({
  jupyter,
  device,
  experiment,
  router
});

export default rootReducer;
