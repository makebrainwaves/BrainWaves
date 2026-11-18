import { describe, expect, it } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import type {
  ExperimentParameters,
  Stimulus,
} from '../../../constants/interfaces';
import { mergeCustomParams } from '../../../experiments/custom/params';
import { assessFeasibility } from '../rules';

const trials = (type: EVENTS, count: number): Stimulus[] =>
  Array.from({ length: count }, (_, i) => ({
    type,
    title: `${type}-${i}`,
    phase: 'main',
  }));

function design(
  hypothesis: string,
  overrides: Partial<ExperimentParameters> = {}
): ExperimentParameters {
  const stimuli = [
    ...trials(EVENTS.STIMULUS_1, 60),
    ...trials(EVENTS.STIMULUS_2, 60),
  ];
  return {
    ...mergeCustomParams({ stimuli, nbTrials: stimuli.length, iti: 1500 }),
    description: { question: '', hypothesis, methods: '' },
    ...overrides,
  };
}

describe('assessFeasibility', () => {
  it('passes a well-powered face vs house design with no pitfalls', () => {
    const result = assessFeasibility(
      design('Faces will produce a bigger N170 than houses.'),
      true
    );
    expect(result.verdict).toBe('feasible');
    expect(result.pitfalls).toEqual([]);
  });

  it('lets an out-of-reach target win over a feasible one in the same text', () => {
    const result = assessFeasibility(
      design('The amygdala will react more to faces.'),
      true
    );
    expect(result.verdict).toBe('not-feasible');
    expect(result.target).toBe('deep brain structures');
  });

  it('flags too few trials per condition for an ERP, but not for behavior-only', () => {
    const few = { nbTrials: 20 };
    expect(
      assessFeasibility(design('Faces show a bigger N170.', few), true).pitfalls
    ).toEqual([expect.stringContaining('about 10 trials')]);
    expect(
      assessFeasibility(design('Faces show a bigger N170.', few), false)
        .pitfalls
    ).toEqual([]);
  });

  it('flags talking during recording but not the default 500 ms ITI', () => {
    const result = assessFeasibility(
      design('People answer out loud faster for faces.', { iti: 500 }),
      true
    );
    expect(result.pitfalls).toEqual([expect.stringContaining('Talking')]);
  });

  it('judges a plan before any stimulus folder is chosen', () => {
    const plan = design('Faces show a bigger N170.', {
      stimuli: [],
      nbTrials: 60,
    });
    expect(assessFeasibility(plan, true).pitfalls).toEqual([
      expect.stringContaining('about 30 trials'),
    ]);
  });

  it('asks for a specific prediction when nothing measurable is named', () => {
    const result = assessFeasibility(design('Pictures are interesting.'), true);
    expect(result.verdict).toBe('unclear');
  });
});
