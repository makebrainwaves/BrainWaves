import { template } from 'lodash';
import { describe, expect, it, vi } from 'vitest';
import { facesHousesExperiment } from '../faces_houses/experiment';
import { params as facesHousesParams } from '../faces_houses/params';
import { instructions as facesHousesInstructions } from '../faces_houses/screens';
import { stroopExperiment } from '../stroop/experiment';
import { instructions as stroopInstructions } from '../stroop/screens';
import { searchExperimentObject } from '../search/experiment';
import { instructions as searchInstructions } from '../search/screens';
import { multitaskingExperimentObject } from '../multitasking/experiment';
import { instructions as multitaskingInstructions } from '../multitasking/screens';
import { customExperiment } from '../custom/experiment';
import { customInstructionsScreen } from '../../utils/labjs/customStimuli';
import { skipPracticeOnRequest } from '../../utils/labjs/functions';
import type { ExperimentParameters } from '../../constants/interfaces';
import {
  acceptedKeys,
  findNode,
  loopCount,
  loopRows,
  StudyNode,
} from './studyTree';

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

it('Stroop examples name the ink and its key, never a mismatching word', () => {
  const html = String(findScreen(stroopExperiment, 'Instruction')?.content);
  const examples = [
    ...html.matchAll(
      /<span style="color: (\w+)">(\w+)<\/span>.*?<figcaption>(.*?)<\/figcaption>/g
    ),
  ];
  expect(examples.length).toBeGreaterThan(0);
  for (const [, ink, word, caption] of examples) {
    expect(caption.toLowerCase()).toContain(`${ink} ink`);
    if (word !== ink) expect(caption.toLowerCase()).not.toContain(word);
    expect(shownKeys(caption)).toEqual(new Set([ink[0]]));
  }
});

/** Evaluates a lab.js option template the way lab.js does, with `parameters` and `state` in scope. */
const renderTemplate = (text: unknown, parameters: object, state: object) => {
  const context = { parameters, state };
  return template(String(text), { escape: '', evaluate: '' }).call(
    context,
    context
  );
};

/** Keys a feedback line tells the participant to press. */
const namedKeys = (line: string) =>
  [...line.matchAll(/\bpress (\w)\b/gi)].map(([, key]) => key.toLowerCase());

/** The text templates of the first canvas screen with this title, one per line. */
const canvasText = (study: unknown, title: string) => {
  const content = findNode(study, title, (node) =>
    Array.isArray(node.content)
  )?.content;
  return (Array.isArray(content) ? content : [])
    .map((object: { text?: string }) => object.text ?? '')
    .join('\n');
};

describe('practice feedback names the right key', () => {
  it('Faces/Houses: each practice picture, answered wrong, names its own key', () => {
    const accepted = new Set(facesHousesParams.stimuli.map((s) => s.response));
    const text = canvasText(facesHousesExperiment, 'Feedback');
    const { rows } = loopRows(
      facesHousesExperiment,
      'Practice loop',
      facesHousesParams
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const wrong = namedKeys(
        renderTemplate(text, row, { correct_response: false })
      );
      expect(wrong).toEqual([row.response]);
      expect(accepted).toContain(row.response);
      expect(
        namedKeys(renderTemplate(text, row, { correct_response: true }))
      ).toEqual([]);
    }
  });

  it('Stroop: each practice word, answered wrong, names the key scored for its ink', () => {
    const responses = findNode(
      stroopExperiment,
      'Stroop screen',
      (node) => !!node.responses
    )?.responses as Record<string, string>;
    const keyForInk = (color: unknown) =>
      /\((\w)\)/.exec(
        Object.entries(responses).find(([, ink]) => ink === color)?.[0] ?? ''
      )?.[1];
    const text = canvasText(stroopExperiment, 'Inter-trial interval');
    const { rows } = loopRows(stroopExperiment, 'Practice task');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const key = keyForInk(row.color);
      expect(key).toBeDefined();
      expect(namedKeys(renderTemplate(text, row, { correct: false }))).toEqual([
        key,
      ]);
      expect(namedKeys(renderTemplate(text, row, { correct: true }))).toEqual(
        []
      );
    }
  });
});

describe.each([
  [
    'Faces/Houses',
    facesHousesInstructions.expect,
    loopCount(facesHousesExperiment, 'Practice loop', facesHousesParams),
    loopCount(facesHousesExperiment, 'Experiment loop', facesHousesParams),
  ],
  [
    'Stroop',
    stroopInstructions.expect,
    loopCount(stroopExperiment, 'Practice task'),
    loopCount(stroopExperiment, 'Stroop task'),
  ],
  [
    'Visual Search',
    searchInstructions.expect,
    loopCount(searchExperimentObject, 'Practice task'),
    loopCount(searchExperimentObject, 'Main task'),
  ],
])('%s instructions', (_, expectLine, practice, recorded) => {
  it('state the practice and recorded trial counts the loops run', () => {
    expect(practice).toBeGreaterThan(0);
    expect(expectLine).toMatch(
      new RegExp(`\\b${practice}\\b.*\\b${recorded}\\b`)
    );
  });
});

describe('Multitasking', () => {
  const study = multitaskingExperimentObject;

  it('states its block and trial counts as the Block loop runs them', () => {
    const { rows } = loopRows(study, 'Block loop');
    const blocks = (task: string) => rows.filter((row) => row.task === task);
    const trials = (task: string) =>
      blocks(task).reduce((sum, row) => sum + Number(row.num_trials), 0);
    expect(multitaskingInstructions.expect).toMatch(
      new RegExp(
        `\\b${blocks('training').length}\\b.*\\b${trials('training')}\\b.*\\b${
          blocks('main').length
        }\\b.*\\b${trials('main')}\\b`
      )
    );
  });

  /** "meaning:key" pairs a rule table shows, e.g. "diamond:b". */
  const rulePairs = (text: string) =>
    new Set(
      [
        ...text
          .replace(/<[^>]+>/g, ' ')
          .matchAll(/\b(Diamond|Rectangle|[23] dots)\W+([a-z])\b/gi),
      ].map(([, meaning, key]) => `${meaning}:${key}`.toLowerCase())
    );

  const correctKey = (
    block: string,
    match: (trial: Record<string, unknown>) => boolean
  ) =>
    loopRows(study, 'Trial loop', { block, num_trials: 8 }).rows.find(match)
      ?.cor_response;
  const scored = new Set([
    `diamond:${correctKey('shape', (t) => t.form === 'diamond')}`,
    `rectangle:${correctKey('shape', (t) => t.form === 'square')}`,
    `2 dots:${correctKey('filling', (t) => t.dots === 2)}`,
    `3 dots:${correctKey('filling', (t) => t.dots === 3)}`,
  ]);

  it('intro rule table maps each figure to the key its trials score', () => {
    expect(
      new Set(
        multitaskingInstructions.rules.flatMap(({ keys }) =>
          keys.map(({ key, meaning }) => `${meaning}:${key}`.toLowerCase())
        )
      )
    ).toEqual(scored);
  });

  it.each([
    ['block description', canvasText(study, 'Block description')],
    [
      'trial footer',
      String(findNode(study, 'Frame', (node) => 'context' in node)?.context),
    ],
  ])(
    '%s rule table maps each figure to the key its trials score',
    (_, text) => {
      expect(rulePairs(text)).toEqual(scored);
    }
  );
});
