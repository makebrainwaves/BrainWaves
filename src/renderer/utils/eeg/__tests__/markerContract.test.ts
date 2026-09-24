/**
 * Regression: every hook-emitted condition label must resolve to the marker
 * code that pack's params declare. Three hooks once hand-rolled `? 1 : 2`
 * ternaries that contradicted their own params — multitasking inverted
 * (Switching emitted 1, params declared 2) and search pointed at the wrong
 * stimulus. Labels + this contract make that bug class unrepresentable.
 */
import { describe, it, expect } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import { resolveMarkerRegistry } from '../markerRegistry';
import {
  triggerEEGCallback as emitFaceHouseCondition,
  emitStroopCondition,
} from '../../labjs/functions';
import { triggerEEGCallback as emitMultiCondition } from '../../../experiments/multitasking/utils';
import { emitSearchCondition } from '../../../experiments/search/utils';
import { params as stroopParams } from '../../../experiments/stroop/params';
import { params as searchParams } from '../../../experiments/search/params';
import { params as multiParams } from '../../../experiments/multitasking/params';
import { params as facesParams } from '../../../experiments/faces_houses/params';

const emit = (
  fn: (this: never) => void,
  parameters: Record<string, unknown>
): string => {
  let emitted: string | undefined;
  fn.call({
    parameters: { ...parameters, callbackForEEG: (l: string) => (emitted = l) },
    data: {},
  } as never);
  return emitted!;
};

describe('marker code contract per pack', () => {
  it.each([
    [
      emitStroopCondition,
      { congruent: 'yes' },
      stroopParams,
      EVENTS.STIMULUS_2,
    ],
    [emitStroopCondition, { congruent: 'no' }, stroopParams, EVENTS.STIMULUS_1],
    [emitSearchCondition, { size: '5' }, searchParams, EVENTS.STIMULUS_1],
    [emitSearchCondition, { size: '15' }, searchParams, EVENTS.STIMULUS_2],
    [emitMultiCondition, { cond: 'Switching' }, multiParams, EVENTS.STIMULUS_2],
    [
      emitMultiCondition,
      { cond: 'No switching' },
      multiParams,
      EVENTS.STIMULUS_1,
    ],
    [
      emitFaceHouseCondition,
      { condition: 'Face' },
      facesParams,
      EVENTS.STIMULUS_1,
    ],
  ])('emits the code declared by its pack', (fn, parameters, params, code) => {
    const label = emit(fn as (this: never) => void, parameters);
    expect(resolveMarkerRegistry(params).eventId[label]).toBe(code);
  });

  it('every built-in pack resolves to a non-empty registry', () => {
    for (const params of [
      stroopParams,
      searchParams,
      multiParams,
      facesParams,
    ]) {
      expect(
        Object.keys(resolveMarkerRegistry(params).eventId).length
      ).toBeGreaterThan(0);
    }
  });
});
