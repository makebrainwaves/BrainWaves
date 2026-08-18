import { describe, it, expect } from 'vitest';
import { EXPERIMENTS } from '../../../constants/constants';
import { getExperimentFromType } from '../functions';

describe('getExperimentFromType', () => {
  it('returns the custom pack, not Faces/Houses, for EXPERIMENTS.CUSTOM', () => {
    const custom = getExperimentFromType(EXPERIMENTS.CUSTOM);
    const faces = getExperimentFromType(EXPERIMENTS.N170);

    expect(custom.params.stimuli).toEqual([]);
    expect(custom.params.stimulus1?.title).toBe('Condition 1');
    expect(custom.params.nbTrials).toBe(0);
    expect(custom.experimentObject).toBeTruthy();
    expect(custom.params).not.toBe(faces.params);
    expect(custom.text.overview.title).toBe('Custom Experiment');
  });
});
