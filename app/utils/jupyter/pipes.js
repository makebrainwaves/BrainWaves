import { Observable } from "rxjs";
import { map, pluck, filter, take, mergeMap } from "rxjs/operators";
import { executeRequest } from "@nteract/messaging";
import { RECEIVE_EXECUTE_REPLY } from "../../epics/jupyterEpics";

// Refactor this so command can be calculated either up stream or inside pipe
export const execute = (command, state$) => source =>
  createPipe(
    source,
    map(() =>
      state$.value.jupyter.mainChannel.next(executeRequest(command))
    )
  );

export const awaitOkMessage = action$ => source =>
  createPipe(
    source,
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_REPLY).pipe(
        pluck("payload"),
        filter(msg => msg.channel === "shell" && msg.content.status === "ok"),
        take(1)
      )
    )
  );

const createPipe = (source, ...pipes) =>
  new Observable(observer =>
    source.pipe(...pipes).subscribe({
      next(event) {
        observer.next(event);
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      }
    })
  );
