import { describe, expect, it, vi } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import { initLoopWithStimuli, initResponseHandlers } from '../functions';
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

describe('initResponseHandlers', () => {
  const makeScreen = (response: string) => {
    const screen = {
      id: '0_1_0_1',
      parameters: { response },
      data: {} as Record<string, unknown>,
      timer: 180,
      end: vi.fn(),
      options: { events: {} as Record<string, (event: { key: string }) => void> },
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
      options: { events: {} as Record<string, (event: { key: string }) => void> },
    };
    initResponseHandlers.call(screen as never);
    screen.parameters.response = '1';
    screen.options.events.keydown({ key: '1' });
    expect(screen.data.correct_response).toBe(true);
  });
});
