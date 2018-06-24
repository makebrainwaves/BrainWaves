// @flow
import { combineReducers } from "redux";
import { routerReducer as router } from "react-router-redux";
import jupyter from "./jupyterReducer";
import device from "./deviceReducer";

const rootReducer = combineReducers({
  jupyter,
  device,
  router
});

export default rootReducer;
