import { describe, expect, it } from 'vitest';
import { PyodideActions } from '../../actions';
import pyodideReducer from '../pyodideReducer';

const initial = pyodideReducer(undefined, { type: '@@INIT' });

describe('pyodideReducer', () => {
  it('new epoch arrays drop suggestions, whose indices pointed into the old ones', () => {
    const suggested = pyodideReducer(
      initial,
      PyodideActions.SetSuggestedRejections([{ index: 4, reason: '212 µV' }])
    );
    const reloaded = pyodideReducer(
      suggested,
      PyodideActions.SetEpochArrays({
        buffer: new ArrayBuffer(0),
        meta: {
          n_epochs: 3,
          n_channels: 1,
          n_times: 1,
          ch_names: ['TP9'],
          times: [0],
          event_codes: [1, 2, 1],
        },
      })
    );

    expect(reloaded.suggestedRejections).toEqual([]);
  });
});
