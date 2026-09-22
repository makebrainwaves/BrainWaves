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
  it('stroop: congruent trial emits the label declared as STIMULUS_2', () => {
    const label = emit(emitStroopCondition, { congruent: 'yes' });
    expect(resolveMarkerRegistry(stroopParams).eventId[label]).toBe(
      EVENTS.STIMULUS_2
    );
  });

  it('stroop: incongruent trial emits the label declared as STIMULUS_1', () => {
    const label = emit(emitStroopCondition, { congruent: 'no' });
    expect(resolveMarkerRegistry(stroopParams).eventId[label]).toBe(
      EVENTS.STIMULUS_1
    );
  });

  it('search: a 5/10-letter trial emits the label declared as STIMULUS_1', () => {
    const label = emit(emitSearchCondition, { size: '5' });
    expect(resolveMarkerRegistry(searchParams).eventId[label]).toBe(
      EVENTS.STIMULUS_1
    );
  });

  it('search: a 15/20-letter trial emits the label declared as STIMULUS_2', () => {
    const label = emit(emitSearchCondition, { size: '15' });
    expect(resolveMarkerRegistry(searchParams).eventId[label]).toBe(
      EVENTS.STIMULUS_2
    );
  });

  it('multitasking: Switching emits the label declared as STIMULUS_2', () => {
    const label = emit(emitMultiCondition, { cond: 'Switching' });
    expect(resolveMarkerRegistry(multiParams).eventId[label]).toBe(
      EVENTS.STIMULUS_2
    );
  });

  it('multitasking: No switching emits the label declared as STIMULUS_1', () => {
    const label = emit(emitMultiCondition, { cond: 'No switching' });
    expect(resolveMarkerRegistry(multiParams).eventId[label]).toBe(
      EVENTS.STIMULUS_1
    );
  });

  it('faces/houses: the generic hook emits the declared condition label', () => {
    const label = emit(emitFaceHouseCondition, { condition: 'Face' });
    expect(resolveMarkerRegistry(facesParams).eventId[label]).toBe(
      EVENTS.STIMULUS_1
    );
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
