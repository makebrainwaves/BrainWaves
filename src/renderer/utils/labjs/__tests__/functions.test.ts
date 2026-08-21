import { describe, expect, it, vi } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import {
  initLoopWithStimuli,
  initPracticeLoopWithStimuli,
  initResponseHandlers,
} from '../functions';
import type { Stimulus } from '../../../constants/interfaces';

// The first image of each condition is tagged 'practice' by the designer, but
// both loops draw from the whole pool — so the tag on the stimulus says nothing
// about which block a trial actually ran in.
const mixedPhaseStimuli: Stimulus[] = [
  {
    type: EVENTS.STIMULUS_1,
    title: 'f1.jpg',
    dir: '/faces',
    filename: 'f1.jpg',
    condition: 'Face',
    response: '1',
    phase: 'practice',
  },
  {
    type: EVENTS.STIMULUS_1,
    title: 'f2.jpg',
    dir: '/faces',
    filename: 'f2.jpg',
    condition: 'Face',
    response: '1',
    phase: 'main',
  },
];

const makeLoop = (parameters: Record<string, unknown>) => ({
  parameters,
  options: {} as {
    templateParameters?: Array<Record<string, unknown>>;
    shuffle?: boolean;
  },
});

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

  it('records every trial it generates as the main block', () => {
    const loop = makeLoop({
      stimuli: mixedPhaseStimuli,
      nbTrials: 2,
      randomize: 'sequential',
    });

    initLoopWithStimuli.call(loop as never);

    // Passing the designer's 'practice' tag through here made behavior/compute
    // discard real task trials as practice.
    expect(loop.options.templateParameters!.map((r) => r.phase)).toEqual([
      'main',
      'main',
    ]);
  });

  it('records every practice-loop trial as the practice block', () => {
    const loop = makeLoop({
      stimuli: mixedPhaseStimuli,
      nbPracticeTrials: 2,
      randomize: 'sequential',
    });

    initPracticeLoopWithStimuli.call(loop as never);

    // faces_houses tags every stimulus 'main', so its practice block used to be
    // analysed as real data.
    expect(loop.options.templateParameters!.map((r) => r.phase)).toEqual([
      'practice',
      'practice',
    ]);
  });
});

describe('initResponseHandlers', () => {
  const makeScreen = (response: string) => {
    const screen = {
      id: '0_1_0_1',
      parameters: { response },
      data: {} as Record<string, unknown>,
      timer: 180,
      end: vi.fn(),
      options: {
        events: {} as Record<string, (event: { key: string }) => void>,
      },
    };
    initResponseHandlers.call(screen as never);
    return screen;
  };

  it('marks a matching key as a correct response', () => {
    const screen = makeScreen('1');
    screen.options.events.keydown({ key: '1' });
    expect(screen.data.correct_response).toBe(true);
    expect(screen.data.response).toBe('1');
    expect(screen.end).toHaveBeenCalledTimes(1);
  });

  it('marks a non-matching key as incorrect', () => {
    const screen = makeScreen('1');
    screen.options.events.keydown({ key: '9' });
    expect(screen.data.correct_response).toBe(false);
  });

  it('reads the expected key at press time, not when the handler is attached', () => {
    const screen = {
      id: '0_1_0_1',
      parameters: { response: '' },
      data: {} as Record<string, unknown>,
      timer: 180,
      end: vi.fn(),
      options: {
        events: {} as Record<string, (event: { key: string }) => void>,
      },
    };
    initResponseHandlers.call(screen as never);
    screen.parameters.response = '1';
    screen.options.events.keydown({ key: '1' });
    expect(screen.data.correct_response).toBe(true);
  });

  it('leaves correctness unscored when the condition has no expected key', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const screen = makeScreen('');

    screen.options.events.keydown({ key: '1' });

    // Recording `false` here is a fabricated verdict: it renders as a
    // participant who got every trial wrong, flattening accuracy to 0% and
    // emptying the reaction-time plot with nothing to point at the cause.
    expect(screen.data.correct_response).toBeUndefined();
    expect(screen.data.response).toBe('1');
    expect(screen.data.response_given).toBe('yes');
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
