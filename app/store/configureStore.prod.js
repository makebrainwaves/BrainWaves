// @flow
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { createHashHistory } from "history";
import { createEpicMiddleware } from "redux-observable";
import rootEpic from "../epics";

import { routerMiddleware } from "react-router-redux";
import rootReducer from "../reducers";

const history = createHashHistory();
const epicMiddleware = createEpicMiddleware(rootEpic);
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router, epicMiddleware);

function configureStore(initialState?: any) {
  return createStore(rootReducer, initialState, enhancer);
}

export default { configureStore, history };
