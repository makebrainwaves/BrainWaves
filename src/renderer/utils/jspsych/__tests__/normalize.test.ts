import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import { normalizeJsPsychTrials, toBehavioralCsv } from '../normalize';
import { aggregateBehaviorDataToSave } from '../../behavior/compute';

const mapping = { conditionKey: 'condition', correctKey: 'correct' };

const trials = [
  {
    trial_index: 0,
    trial_type: 'image-keyboard-response',
    time_elapsed: 1200,
    rt: 480,
    response: 'f',
    condition: 'Face',
    correct: true,
  },
  {
    trial_index: 1,
    trial_type: 'image-keyboard-response',
    time_elapsed: 2600,
    rt: 610,
    response: 'j',
    condition: 'House',
    correct: true,
  },
  {
    trial_index: 2,
    trial_type: 'image-keyboard-response',
    time_elapsed: 4000,
    rt: null,
    response: null,
    condition: 'House',
    correct: false,
  },
];

describe('normalizeJsPsychTrials', () => {
  it('makes trial_number 1-based so compute.js does not drop the first trial', () => {
    // compute.js filterData: .filter((row) => row.trial_number && ...)
    expect(normalizeJsPsychTrials(trials, mapping).map((r) => r.trial_number)).toEqual(
      [1, 2, 3]
    );
  });

  it('derives response_given from rt and emits the strings compute.js compares', () => {
    const rows = normalizeJsPsychTrials(trials, mapping);
    expect(rows.map((r) => r.response_given)).toEqual(['yes', 'yes', 'no']);
    expect(rows.map((r) => r.correct_response)).toEqual([
      'true',
      'true',
      'false',
    ]);
    expect(rows.map((r) => r.reaction_time)).toEqual([480, 610, '']);
  });

  it('reads the condition off the flat trial row under the chosen key', () => {
    expect(
      normalizeJsPsychTrials(trials, {
        conditionKey: 'condition',
        correctKey: '',
      }).map((r) => r.condition)
    ).toEqual(['Face', 'House', 'House']);
  });

  it('counts every trial as correct when correctness is not measured', () => {
    const rows = normalizeJsPsychTrials(trials, {
      conditionKey: 'condition',
      correctKey: '',
    });
    expect(rows.every((r) => r.correct_response === 'true')).toBe(true);
  });

  it('defaults phase to test and passes practice through verbatim', () => {
    expect(
      normalizeJsPsychTrials(
        [
          { trial_index: 0, rt: 100, condition: 'Face', phase: 'practice' },
          { trial_index: 1, rt: 100, condition: 'Face' },
        ],
        mapping
      ).map((r) => r.phase)
    ).toEqual(['practice', 'test']);
  });

  it('emits an empty condition when no condition key has been chosen', () => {
    const rows = normalizeJsPsychTrials(trials, {
      conditionKey: '',
      correctKey: '',
    });
    expect(rows.every((r) => r.condition === '')).toBe(true);
  });
});

describe('toBehavioralCsv', () => {
  it('emits a stable header even with no rows', () => {
    expect(toBehavioralCsv([])).toBe(
      'trial_number,condition,reaction_time,response_given,correct_response,phase,trial_type,time_elapsed'
    );
  });

  it('round-trips through Papa.parse into rows compute.js aggregates', () => {
    const csv = toBehavioralCsv(normalizeJsPsychTrials(trials, mapping));
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

    const aggregated = aggregateBehaviorDataToSave(
      [
        {
          data: parsed.data,
          meta: { ...parsed.meta, datafile: '/tmp/Sub1-GroupA-1-behavior.csv' },
        },
      ],
      false
    );

    expect(aggregated).toEqual([
      {
        subject: 'Sub1',
        group: 'GroupA',
        session: '1',
        RT_Face: 480,
        Accuracy_Face: 100,
        RT_House: 610,
        Accuracy_House: 50,
      },
    ]);
  });
});
