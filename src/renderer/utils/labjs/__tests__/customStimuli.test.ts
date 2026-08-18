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
      },
      {
        dir: '/houses',
        title: 'House',
        response: '9',
        type: EVENTS.STIMULUS_2,
        images: ['House1.jpg'],
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
        },
        {
          dir: '/cats',
          title: 'Cat',
          response: '2',
          type: EVENTS.STIMULUS_2,
          images: [],
        },
      ])
    ).toEqual([]);
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
});
