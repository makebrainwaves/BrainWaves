import { describe, expect, it, vi } from 'vitest';
import { flowFromStructure } from '../../components/PrepareSteps/flow';
import { prepare as faces } from '../faces_houses/prepare';
import { prepare as stroop } from '../stroop/prepare';
import { prepare as search } from '../search/prepare';
import { prepare as multi } from '../multitasking/prepare';
import { facesHousesExperiment } from '../faces_houses/experiment';
import { params as facesParams } from '../faces_houses/params';
import { params as stroopParams } from '../stroop/params';
import { params as searchParams } from '../search/params';
import { params as multiParams } from '../multitasking/params';
import { resolveMarkerRegistry } from '../../utils/eeg/markerRegistry';
import { stroopExperiment } from '../stroop/experiment';
import { searchExperimentObject } from '../search/experiment';
import { multitaskingExperimentObject } from '../multitasking/experiment';
import { acceptedKeys, loopCount, loopRows } from './studyTree';

vi.mock('lab.js', () => ({}));

/** Keys shown in the protocol diagram. */
const shownKeys = (p: { responses: { key: string }[] }) =>
  new Set(p.responses.map(({ key }) => key.toLowerCase()));

describe('flowFromStructure', () => {
  it('describes a linear task with practice and recorded trials', () => {
    expect(flowFromStructure({ practice: 6, recorded: 120 })).toEqual([
      { label: 'Instructions' },
      { label: 'Practice trials', count: 6 },
      { label: 'Main-task reminder' },
      { label: 'Recorded trials', count: 120 },
      { label: 'Completion' },
    ]);
  });

  it('describes a block task without a study-wide total', () => {
    const flow = flowFromStructure({
      blocks: [
        { label: 'Practice blocks', practice: 2 },
        { label: 'Recorded blocks', recorded: 4 },
      ],
    });
    expect(flow).toEqual([
      { label: 'Instructions' },
      { label: 'Practice blocks', count: 2 },
      { label: 'Main-task reminder' },
      { label: 'Recorded blocks', count: 4 },
      { label: 'Completion' },
    ]);
  });
});

describe('per-experiment prepare content', () => {
  it('Faces/Houses shows the keys its stimuli accept, and 6 practice / 120 recorded', () => {
    expect(shownKeys(faces)).toEqual(new Set(['1', '9']));
    expect(shownKeys(faces)).toEqual(
      new Set([
        ...acceptedKeys(facesHousesExperiment),
        ...facesParams.stimuli.map(({ response }) => response),
      ])
    );
    expect(loopCount(facesHousesExperiment, 'Practice loop', facesParams)).toBe(
      6
    );
    expect(
      loopCount(facesHousesExperiment, 'Experiment loop', facesParams)
    ).toBe(120);
    expect(faces.flow).toContainEqual({ label: 'Practice trials', count: 6 });
    expect(faces.flow).toContainEqual({ label: 'Recorded trials', count: 120 });
  });

  it('Stroop shows r/g/b/y, and 8 practice / 96 recorded', () => {
    expect(shownKeys(stroop)).toEqual(new Set(['r', 'g', 'b', 'y']));
    expect(shownKeys(stroop)).toEqual(acceptedKeys(stroopExperiment));
    expect(loopCount(stroopExperiment, 'Practice task')).toBe(8);
    expect(loopCount(stroopExperiment, 'Stroop task')).toBe(96);
    expect(stroop.flow).toContainEqual({ label: 'Practice trials', count: 8 });
    expect(stroop.flow).toContainEqual({ label: 'Recorded trials', count: 96 });
  });

  it('Visual Search shows b/n, and 8 practice / 80 recorded', () => {
    expect(shownKeys(search)).toEqual(new Set(['b', 'n']));
    expect(shownKeys(search)).toEqual(acceptedKeys(searchExperimentObject));
    expect(loopCount(searchExperimentObject, 'Practice task')).toBe(8);
    expect(loopCount(searchExperimentObject, 'Main task')).toBe(80);
    expect(search.flow).toContainEqual({ label: 'Practice trials', count: 8 });
    expect(search.flow).toContainEqual({ label: 'Recorded trials', count: 80 });
  });

  it('Multitasking shows its rules on b/n and never claims a study-wide total', () => {
    expect(shownKeys(multi)).toEqual(new Set(['b', 'n']));
    expect(shownKeys(multi)).toEqual(
      acceptedKeys(multitaskingExperimentObject)
    );
    expect(multi.flow.some((p) => /recorded trials/i.test(p.label))).toBe(
      false
    );

    const { rows: blocks } = loopRows(
      multitaskingExperimentObject,
      'Block loop'
    );
    expect(multi.flow.map(({ count }) => count).filter(Boolean)).toEqual([
      blocks.filter(({ task }) => task === 'training').length,
      blocks.filter(({ task }) => task === 'main').length,
    ]);
  });

  it('Multitasking maps each rule to the key its trials score as correct', () => {
    const correctKey = (
      block: string,
      match: (trial: Record<string, unknown>) => boolean
    ) => {
      const { rows } = loopRows(multitaskingExperimentObject, 'Trial loop', {
        block,
        num_trials: 8,
      });
      return rows.find(match)?.cor_response;
    };
    expect(multi.responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Top: diamond',
          key: correctKey('shape', (t) => t.form === 'diamond'),
        }),
        expect.objectContaining({
          label: 'Top: rectangle',
          key: correctKey('shape', (t) => t.form === 'square'),
        }),
        expect.objectContaining({
          label: 'Bottom: 2 dots',
          key: correctKey('filling', (t) => t.dots === 2),
        }),
        expect.objectContaining({
          label: 'Bottom: 3 dots',
          key: correctKey('filling', (t) => t.dots === 3),
        }),
      ])
    );
  });
});

describe('built-in comparisons and predictions', () => {
  it.each([
    ['Faces/Houses', faces, facesParams],
    ['Stroop', stroop, stroopParams],
    ['Visual Search', search, searchParams],
    ['Multitasking', multi, multiParams],
  ])(
    '%s compares and predicts its own condition labels',
    (_, prepare, params) => {
      const labels = Object.keys(resolveMarkerRegistry(params).eventId);
      expect(labels).toEqual(
        expect.arrayContaining([
          ...prepare.compare!.conditions,
          ...prepare.prediction!.conditions,
        ])
      );
      const directions = prepare.prediction!.options.map((o) => o.direction);
      expect(directions.length).toBeGreaterThanOrEqual(2);
      expect(new Set(directions).size).toBe(directions.length);
    }
  );
});
