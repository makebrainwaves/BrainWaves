import { pipe } from 'rxjs';
import { map, pluck, filter, take, mergeMap } from 'rxjs/operators';
import { executeRequest } from '@nteract/messaging';
import { PyodideActions } from '../../actions';
import { RECEIVE_EXECUTE_REPLY } from '../../epics/pyodideEpics';

// Refactor this so command can be calculated either up stream or inside pipe
export const execute = (command, state$) =>
  pipe(
    map(() => state$.value.pyodide.mainChannel.next(executeRequest(command)))
  );

export const awaitOkMessage = (action$) =>
  pipe(
    mergeMap(() =>
      action$.ofType(PyodideActions.ReceiveExecuteReply.type).pipe(
        pluck('payload'),
        filter<any>(
          (msg) => msg.channel === 'shell' && msg.content.status === 'ok'
        ),
        take(1)
      )
    )
  );
