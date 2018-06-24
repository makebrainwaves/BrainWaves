import { combineEpics } from "redux-observable";
import jupyter from "./jupyterEpics";
import device from "./deviceEpics";

export default combineEpics(device, jupyter);
