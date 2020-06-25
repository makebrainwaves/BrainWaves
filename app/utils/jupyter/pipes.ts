import { pipe } from 'rxjs';
import { map, pluck, filter, take, mergeMap } from 'rxjs/operators';
import { executeRequest } from '@nteract/messaging';
import { RECEIVE_EXECUTE_REPLY } from '../../epics/jupyterEpics';

// Refactor this so command can be calculated either up stream or inside pipe
export const execute = (command, state$) =>
  pipe(
    map(() => state$.value.jupyter.mainChannel.next(executeRequest(command)))
  );

export const awaitOkMessage = action$ =>
  pipe(
    mergeMap(() =>
      action$.ofType(RECEIVE_EXECUTE_REPLY).pipe(
        pluck('payload'),
        filter(msg => msg.channel === 'shell' && msg.content.status === 'ok'),
        take(1)
      )
    )
  );
