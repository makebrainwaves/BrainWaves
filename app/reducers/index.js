// @flow
import { combineReducers } from "redux";
import { routerReducer as router } from "react-router-redux";
import counter from "./counter";
import jupyter from "./jupyter";

const rootReducer = combineReducers({
  counter,
  jupyter,
  router
});

export default rootReducer;
