import { combineEpics } from "redux-observable";
import { Observable } from "rxjs";
import { INCREMENT_COUNTER } from "../actions/counter";
import { map, tap } from "rxjs/operators";

const EPIC_RESULT = "EPIC_RESULT";

// -------------------------------------------------------------------------
// Action Creators

const epicResult = payload => ({
  payload,
  type: EPIC_RESULT
});

const counter = (action$, store) =>
  action$
    .ofType(INCREMENT_COUNTER)
    .pipe(tap(() => console.log("epic fired")), map(epicResult));

export default combineEpics(counter);
