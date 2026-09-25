import { describe, expect, it, vi } from 'vitest';
import { facesHousesExperiment } from '../faces_houses/experiment';
import { params as facesHousesParams } from '../faces_houses/params';
import { stroopExperiment } from '../stroop/experiment';
import { searchExperimentObject } from '../search/experiment';
import { multitaskingExperimentObject } from '../multitasking/experiment';

vi.mock('lab.js', () => ({}));

type Node = {
  title?: string;
  content?: unknown;
  responses?: Record<string, string>;
};

/** Every non-Space, non-skip key any screen in the study responds to. */
const acceptedKeys = (node: unknown, out = new Set<string>()): Set<string> => {
  if (Array.isArray(node)) node.forEach((child) => acceptedKeys(child, out));
  else if (node && typeof node === 'object') {
    for (const key of Object.keys((node as Node).responses ?? {})) {
      const match = /^key(?:press|down)\((.+)\)$/.exec(key);
      if (match && match[1] !== 'Space' && match[1] !== 'q')
        out.add(match[1].toLowerCase());
    }
    Object.values(node).forEach((child) => acceptedKeys(child, out));
  }
  return out;
};

/** The `content` of the first screen with this title. */
const screenContent = (node: unknown, title: string): string | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = screenContent(child, title);
      if (found) return found;
    }
  } else if (node && typeof node === 'object') {
    if (
      (node as Node).title === title &&
      typeof (node as Node).content === 'string'
    )
      return (node as Node).content as string;
    for (const child of Object.values(node)) {
      const found = screenContent(child, title);
      if (found) return found;
    }
  }
  return undefined;
};

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
      const html = screenContent(study, instructionTitle as string) ?? '';
      expect(shownKeys(html)).toEqual(accepted);
    });

    it.runIf(transitionTitle)(
      'show the same keys again before the recorded task',
      () => {
        const html = screenContent(study, transitionTitle as string) ?? '';
        expect(shownKeys(html)).toEqual(accepted);
      }
    );
  }
);
