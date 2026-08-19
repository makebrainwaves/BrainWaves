import { describe, expect, it } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import { initLoopWithStimuli } from '../functions';
import type { Stimulus } from '../../../constants/interfaces';

describe('initLoopWithStimuli', () => {
  it('adds filepath/audiopath stimulus URLs and balances conditions', () => {
    const stimuli: Stimulus[] = [
      {
        type: EVENTS.STIMULUS_1,
        title: 'a.jpg',
        dir: '/faces',
        filename: 'a.jpg',
        audioDir: '/tones',
        audioFilename: 'beep.mp3',
        condition: 'Face',
        phase: 'main',
      },
      {
        type: EVENTS.STIMULUS_2,
        title: 'low.wav',
        audioDir: '/tones',
        audioFilename: 'low.wav',
        condition: 'Tone',
        phase: 'main',
      },
    ];
    const loop = {
      parameters: { stimuli, nbTrials: 2, randomize: 'sequential' },
      options: {} as {
        templateParameters?: Array<Record<string, unknown>>;
        shuffle?: boolean;
      },
    };

    initLoopWithStimuli.call(loop as never);

    const rows = loop.options.templateParameters!;
    expect(rows).toHaveLength(2);
    expect(rows[0].filepath).toContain('bwfile://');
    expect(rows[0].audiopath).toContain('beep.mp3');
    expect(rows[1].filepath).toBeUndefined();
    expect(rows[1].audiopath).toContain('low.wav');
    expect(loop.options.shuffle).toBe(false);
  });
});
