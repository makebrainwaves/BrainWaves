import { combineEpics } from "redux-observable";
import counter from "./counter";
import jupyter from "./jupyter";

export default combineEpics(counter, jupyter);
