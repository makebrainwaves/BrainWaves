import { combineEpics } from "redux-observable";
import jupyter from "./jupyterEpics";
import device from "./deviceEpics";
import experiment from "./experimentEpics";

export default combineEpics(device, jupyter, experiment);
