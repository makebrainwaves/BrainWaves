import { describe, expect, it, vi } from 'vitest';
import { facesHousesExperiment } from '../faces_houses/experiment';
import { params as facesHousesParams } from '../faces_houses/params';
import { stroopExperiment } from '../stroop/experiment';
import { searchExperimentObject } from '../search/experiment';
import { multitaskingExperimentObject } from '../multitasking/experiment';
import { customExperiment } from '../custom/experiment';
import { customInstructionsScreen } from '../../utils/labjs/customStimuli';
import { skipPracticeOnRequest } from '../../utils/labjs/functions';
import type { ExperimentParameters } from '../../constants/interfaces';
import { acceptedKeys, findNode, StudyNode } from './studyTree';

vi.mock('lab.js', () => ({}));

/** The first screen with this title and string content. */
const findScreen = (node: unknown, title: string): StudyNode | undefined =>
  findNode(node, title, (screen) => typeof screen.content === 'string');

/** Response keycaps on a participant screen (Space and the Q skip hint excluded). */
const shownKeys = (html: string) =>
  new Set(
    [...html.matchAll(/<kbd class="bw-participant-key">([^<]+)<\/kbd>/g)]
      .map(([, key]) => key.toLowerCase())
      .filter((key) => key !== 'q')
  );

describe.each([
  [
    'Faces/Houses',
    facesHousesExperiment,
    'Instruction',
    'Main task',
    facesHousesParams.stimuli.map(({ response }) => response),
  ],
  ['Stroop', stroopExperiment, 'Instruction', 'Main task', []],
  [
    'Visual Search',
    searchExperimentObject,
    'Instruction',
    'Main task instruction',
    [],
  ],
  ['Multitasking', multitaskingExperimentObject, 'Intro', undefined, []],
])(
  '%s participant screens',
  (_, study, instructionTitle, transitionTitle, dynamicKeys) => {
    const accepted = new Set([...acceptedKeys(study), ...dynamicKeys]);

    it('show exactly the keys the trials accept before practice', () => {
      const html = String(findScreen(study, instructionTitle)?.content ?? '');
      expect(shownKeys(html)).toEqual(accepted);
    });

    it.runIf(transitionTitle)(
      'show the same keys again before the recorded task',
      () => {
        const html = String(
          findScreen(study, transitionTitle as string)?.content ?? ''
        );
        expect(shownKeys(html)).toEqual(accepted);
      }
    );

    it('skip practice on Q exactly where the screen offers it', () => {
      const instruction = findScreen(study, instructionTitle);
      expect(instruction?.hooks?.end === skipPracticeOnRequest).toBe(
        String(instruction?.content).includes('bw-participant-skip')
      );
    });
  }
);

it('Custom skips practice on Q, as its screen offers', () => {
  expect(customInstructionsScreen({} as ExperimentParameters)).toContain(
    'bw-participant-skip'
  );
  expect(findScreen(customExperiment, 'Instruction')?.hooks?.end).toBe(
    skipPracticeOnRequest
  );
});
