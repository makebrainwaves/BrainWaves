import { describe, expect, it } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import { mergeCustomParams } from '../params';

describe('mergeCustomParams', () => {
  it('fills required nested fields in sparse restored parameters', () => {
    const merged = mergeCustomParams({
      description: { question: 'Question' },
      stimulus1: { title: 'Faces' },
    });

    expect(merged.description).toEqual({
      question: 'Question',
      hypothesis: '',
      methods: '',
    });
    expect(merged.stimulus1).toEqual({
      dir: '',
      title: 'Faces',
      type: EVENTS.STIMULUS_1,
      response: '',
    });
  });
});
