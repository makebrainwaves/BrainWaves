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

  it('returns the imported pack, with an empty condition contract, for EXPERIMENTS.IMPORTED', () => {
    const imported = getExperimentFromType(EXPERIMENTS.IMPORTED);

    expect(imported.params.imported).toEqual({
      kind: 'jspsych',
      file: '',
      conditionKey: '',
      correctKey: '',
      conditionLabels: [],
    });
    // Nothing deserializes an imported study through lab.core.deserialize, and
    // the lab.js runtime bails on a missing `type`, so the graph stays empty.
    expect(imported.experimentObject).toEqual({});
    expect(imported.params.stimuli).toEqual([]);
    expect(imported.text.overview.title).toBe('Imported Experiment');
  });
});
