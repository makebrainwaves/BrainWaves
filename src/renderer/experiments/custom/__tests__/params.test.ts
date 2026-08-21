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
      audioDir: '',
      title: 'Faces',
      type: EVENTS.STIMULUS_1,
      response: '',
    });
    // stimulus1 has no folder, so it isn't an active condition and gets no key.
  });

  it('gives active conditions a response key when the saved workspace has none', () => {
    const merged = mergeCustomParams({
      stimulus1: { title: 'Faces', dir: '/faces', response: '' },
      stimulus2: { title: 'Houses', dir: '/houses', response: '' },
      stimuli: [
        { type: EVENTS.STIMULUS_1, title: 'f1.png', condition: 'Faces' },
        { type: EVENTS.STIMULUS_2, title: 'h1.png', condition: 'Houses' },
      ],
    });

    // Without a key every trial scores as incorrect, which is indistinguishable
    // from a participant who got everything wrong.
    expect(merged.stimulus1?.response).toBe('1');
    expect(merged.stimulus2?.response).toBe('9');
    expect(merged.stimuli?.map((s) => s.response)).toEqual(['1', '9']);
  });

  it('keeps response keys the student already chose', () => {
    const merged = mergeCustomParams({
      stimulus1: { title: 'Faces', dir: '/faces', response: '3' },
      stimulus2: { title: 'Houses', dir: '/houses', response: '7' },
    });

    expect(merged.stimulus1?.response).toBe('3');
    expect(merged.stimulus2?.response).toBe('7');
  });
});
