import { describe, it, expect } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import { ExperimentParameters } from '../../../constants/interfaces';
import {
  assignDefaultResponses,
  emptyConditionSlot,
  rebuildStimuliFromSlots,
  stimuliFromImageLists,
  titleFromFolder,
  type ConditionSlot,
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

  it('names an untitled sound-only condition after its sound folder', () => {
    const stimuli = stimuliFromImageLists([
      {
        dir: '',
        audioDir: '/Users/me/stimuli/Tones',
        // stimulus3/stimulus4 ship with an empty title, so an unnamed
        // sound-only condition used to write an empty `condition` column and
        // collapse every trial into one unnamed bucket.
        title: '',
        response: '1',
        type: EVENTS.STIMULUS_3,
        images: [],
        sounds: ['low.wav'],
      },
    ]);

    expect(stimuli.map((s) => s.condition)).toEqual(['Tones']);
  });

  it('falls back to "Condition N" when a condition has no name or folder name', () => {
    const stimuli = stimuliFromImageLists([
      {
        dir: '',
        audioDir: '/',
        title: '',
        response: '1',
        type: EVENTS.STIMULUS_4,
        images: [],
        sounds: ['low.wav'],
      },
    ]);

    expect(stimuli.map((s) => s.condition)).toEqual(['Condition 4']);
  });
});

describe('titleFromFolder', () => {
  it('uses the folder basename when the title is still the default Condition N', () => {
    expect(titleFromFolder('/Users/me/stimuli/Faces', 'Condition 1')).toBe(
      'Faces'
    );
  });

  it('keeps a user-edited title', () => {
    expect(titleFromFolder('/Users/me/stimuli/Faces', 'Houses')).toBe('Houses');
  });
});

describe('assignDefaultResponses', () => {
  const slot = (over: Partial<ConditionSlot>) => ({
    ...emptyConditionSlot(EVENTS.STIMULUS_1, ''),
    ...over,
  });

  it('spaces two active conditions at 1 and 9', () => {
    const next = assignDefaultResponses({
      stimulus1: slot({ type: EVENTS.STIMULUS_1, dir: '/a' }),
      stimulus2: slot({ type: EVENTS.STIMULUS_2, dir: '/b' }),
    } as ExperimentParameters);
    expect(next.stimulus1?.response).toBe('1');
    expect(next.stimulus2?.response).toBe('9');
  });

  it('spaces three active conditions at 1, 5, 9', () => {
    const next = assignDefaultResponses({
      stimulus1: slot({ type: EVENTS.STIMULUS_1, dir: '/a' }),
      stimulus2: slot({ type: EVENTS.STIMULUS_2, dir: '/b' }),
      stimulus3: slot({ type: EVENTS.STIMULUS_3, audioDir: '/c' }),
    } as ExperimentParameters);
    expect([
      next.stimulus1?.response,
      next.stimulus2?.response,
      next.stimulus3?.response,
    ]).toEqual(['1', '5', '9']);
  });

  it('spaces four active conditions at 1, 4, 6, 9', () => {
    const next = assignDefaultResponses({
      stimulus1: slot({ type: EVENTS.STIMULUS_1, dir: '/a' }),
      stimulus2: slot({ type: EVENTS.STIMULUS_2, dir: '/b' }),
      stimulus3: slot({ type: EVENTS.STIMULUS_3, dir: '/c' }),
      stimulus4: slot({ type: EVENTS.STIMULUS_4, dir: '/d' }),
    } as ExperimentParameters);
    expect([
      next.stimulus1?.response,
      next.stimulus2?.response,
      next.stimulus3?.response,
      next.stimulus4?.response,
    ]).toEqual(['1', '4', '6', '9']);
  });

  it('reassigns 1 and 9 to 1, 5, 9 when a third condition is added', () => {
    const next = assignDefaultResponses({
      stimulus1: slot({ type: EVENTS.STIMULUS_1, dir: '/a', response: '1' }),
      stimulus2: slot({ type: EVENTS.STIMULUS_2, dir: '/b', response: '9' }),
      stimulus3: slot({ type: EVENTS.STIMULUS_3, dir: '/c' }),
    } as ExperimentParameters);
    expect([
      next.stimulus1?.response,
      next.stimulus2?.response,
      next.stimulus3?.response,
    ]).toEqual(['1', '5', '9']);
  });

  it('updates existing stimuli to the remapped keys', () => {
    const next = assignDefaultResponses({
      stimulus1: slot({ type: EVENTS.STIMULUS_1, dir: '/a', response: '1' }),
      stimulus2: slot({ type: EVENTS.STIMULUS_2, dir: '/b', response: '9' }),
      stimulus3: slot({ type: EVENTS.STIMULUS_3, dir: '/c' }),
      stimuli: [
        { type: EVENTS.STIMULUS_1, title: 'a', response: '1' },
        { type: EVENTS.STIMULUS_2, title: 'b', response: '9' },
      ],
    } as ExperimentParameters);
    expect(next.stimuli?.map((s) => s.response)).toEqual(['1', '5']);
  });

  it('leaves a student-chosen key alone and only fills the unset condition', () => {
    const next = assignDefaultResponses({
      stimulus1: slot({ type: EVENTS.STIMULUS_1, dir: '/a', response: '3' }),
      stimulus2: slot({ type: EVENTS.STIMULUS_2, dir: '/b', response: '7' }),
      stimulus3: slot({ type: EVENTS.STIMULUS_3, dir: '/c' }),
    } as ExperimentParameters);
    expect([next.stimulus1?.response, next.stimulus2?.response]).toEqual([
      '3',
      '7',
    ]);
    expect(next.stimulus3?.response).toBe('1');
  });

  it('does not renumber keys the student picked when a folder is swapped', () => {
    const next = assignDefaultResponses({
      stimulus1: slot({ type: EVENTS.STIMULUS_1, dir: '/a', response: '2' }),
      stimulus2: slot({ type: EVENTS.STIMULUS_2, dir: '/b', response: '8' }),
    } as ExperimentParameters);
    expect([next.stimulus1?.response, next.stimulus2?.response]).toEqual([
      '2',
      '8',
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
