import { describe, it, expect } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import { ExperimentParameters } from '../../../constants/interfaces';
import {
  emptyConditionSlot,
  rebuildStimuliFromSlots,
  stimuliFromImageLists,
} from '../customStimuli';

describe('stimuliFromImageLists', () => {
  it('builds one stimulus per image and marks the first of each condition as practice', () => {
    const stimuli = stimuliFromImageLists([
      {
        dir: '/faces',
        title: 'Face',
        response: '1',
        type: EVENTS.STIMULUS_1,
        images: ['Face1.jpg', 'Face2.jpg'],
        sounds: [],
      },
      {
        dir: '/houses',
        title: 'House',
        response: '9',
        type: EVENTS.STIMULUS_2,
        images: ['House1.jpg'],
        sounds: [],
      },
    ]);

    expect(stimuli).toEqual([
      {
        dir: '/faces',
        filename: 'Face1.jpg',
        title: 'Face1.jpg',
        condition: 'Face',
        response: '1',
        phase: 'practice',
        type: EVENTS.STIMULUS_1,
      },
      {
        dir: '/faces',
        filename: 'Face2.jpg',
        title: 'Face2.jpg',
        condition: 'Face',
        response: '1',
        phase: 'main',
        type: EVENTS.STIMULUS_1,
      },
      {
        dir: '/houses',
        filename: 'House1.jpg',
        title: 'House1.jpg',
        condition: 'House',
        response: '9',
        phase: 'practice',
        type: EVENTS.STIMULUS_2,
      },
    ]);
  });

  it('skips condition slots with no directory or no images', () => {
    expect(
      stimuliFromImageLists([
        {
          dir: '',
          title: 'Empty',
          response: '1',
          type: EVENTS.STIMULUS_1,
          images: ['x.jpg'],
          sounds: [],
        },
        {
          dir: '/cats',
          title: 'Cat',
          response: '2',
          type: EVENTS.STIMULUS_2,
          images: [],
          sounds: [],
        },
      ])
    ).toEqual([]);
  });

  it('pairs sounds with images index-wise, cycling shorter sound lists', () => {
    const stimuli = stimuliFromImageLists([
      {
        dir: '/faces',
        audioDir: '/tones',
        title: 'Face',
        response: '1',
        type: EVENTS.STIMULUS_1,
        images: ['Face1.jpg', 'Face2.jpg', 'Face3.jpg'],
        sounds: ['beep.mp3', 'boop.wav'],
      },
    ]);

    expect(stimuli.map((s) => [s.filename, s.audioFilename, s.phase])).toEqual([
      ['Face1.jpg', 'beep.mp3', 'practice'],
      ['Face2.jpg', 'boop.wav', 'main'],
      ['Face3.jpg', 'beep.mp3', 'main'],
    ]);
    expect(stimuli[0].audioDir).toBe('/tones');
  });

  it('builds audio-only trials when a condition has only a sound folder', () => {
    const stimuli = stimuliFromImageLists([
      {
        dir: '',
        audioDir: '/tones',
        title: 'Tone',
        response: '1',
        type: EVENTS.STIMULUS_1,
        images: [],
        sounds: ['low.wav', 'high.wav'],
      },
    ]);

    expect(stimuli).toEqual([
      {
        audioDir: '/tones',
        audioFilename: 'low.wav',
        title: 'low.wav',
        condition: 'Tone',
        response: '1',
        phase: 'practice',
        type: EVENTS.STIMULUS_1,
      },
      {
        audioDir: '/tones',
        audioFilename: 'high.wav',
        title: 'high.wav',
        condition: 'Tone',
        response: '1',
        phase: 'main',
        type: EVENTS.STIMULUS_1,
      },
    ]);
  });
});

describe('rebuildStimuliFromSlots', () => {
  it('reads images per condition dir and applies the 2020 practice rule', async () => {
    const params = {
      stimulus1: {
        ...emptyConditionSlot(EVENTS.STIMULUS_1, 'Face'),
        dir: '/faces',
        response: '1',
      },
      stimulus2: {
        ...emptyConditionSlot(EVENTS.STIMULUS_2, 'House'),
        dir: '/houses',
        response: '9',
      },
    } as ExperimentParameters;

    const readImages = async (dir: string) =>
      dir === '/faces' ? ['Face1.jpg', 'Face2.jpg'] : ['House1.jpg'];

    const stimuli = await rebuildStimuliFromSlots(params, readImages);
    expect(stimuli.map((s) => [s.condition, s.phase, s.filename])).toEqual([
      ['Face', 'practice', 'Face1.jpg'],
      ['Face', 'main', 'Face2.jpg'],
      ['House', 'practice', 'House1.jpg'],
    ]);
  });

  it('reads sounds per condition audioDir and pairs them with images', async () => {
    const params = {
      stimulus1: {
        ...emptyConditionSlot(EVENTS.STIMULUS_1, 'Face'),
        dir: '/faces',
        audioDir: '/tones',
        response: '1',
      },
    } as ExperimentParameters;

    const readImages = async () => ['Face1.jpg', 'Face2.jpg'];
    const readAudioFiles = async (dir: string) =>
      dir === '/tones' ? ['beep.mp3'] : [];

    const stimuli = await rebuildStimuliFromSlots(
      params,
      readImages,
      readAudioFiles
    );
    expect(stimuli.map((s) => [s.filename, s.audioFilename])).toEqual([
      ['Face1.jpg', 'beep.mp3'],
      ['Face2.jpg', 'beep.mp3'],
    ]);
  });
});
