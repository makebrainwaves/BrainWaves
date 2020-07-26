import { pipe } from 'rxjs';
import { map, pluck, filter, take, mergeMap } from 'rxjs/operators';
import { executeRequest } from '@nteract/messaging';
import { JupyterActions } from '../../actions';

// Refactor this so command can be calculated either up stream or inside pipe
export const execute = (command, state$) =>
  pipe(
    map(() => state$.value.jupyter.mainChannel.next(executeRequest(command)))
  );

export const awaitOkMessage = action$ =>
  pipe(
    mergeMap(() =>
      action$.ofType(JupyterActions.ReceiveExecuteReply.type).pipe(
        pluck('payload'),
        filter<any>(
          msg => msg.channel === 'shell' && msg.content.status === 'ok'
        ),
        take(1)
      )
    )
  );
