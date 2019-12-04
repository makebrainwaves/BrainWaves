// @flow
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { createEpicMiddleware } from 'redux-observable';
import rootEpic from '../epics';

import { routerMiddleware } from 'react-router-redux';
import rootReducer from '../reducers';

const history = createHashHistory();
const epicMiddleware = createEpicMiddleware();
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router, epicMiddleware);

function configureStore(initialState?: any) {
  const store = createStore(rootReducer, initialState, enhancer);
  epicMiddleware.run(rootEpic);
  return store;
}

export default { configureStore, history };
