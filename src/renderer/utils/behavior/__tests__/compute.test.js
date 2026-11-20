import { describe, expect, it } from 'vitest';
import { aggregateDataForPlot } from '../compute';
import { RENAMED_CONDITIONS } from '../../eeg/markerRegistry';
import { EXPERIMENTS } from '../../../constants/constants';

describe('aggregateDataForPlot', () => {
  it('does not throw when given a Promise instead of an array', () => {
    expect(() =>
      aggregateDataForPlot(Promise.resolve([]), 'RT', true, 'errorbars')
    ).not.toThrow();
  });

  const makeDataset = (correct, conditions = ['Faces']) => [
    {
      meta: { datafile: '/tmp/sub-grp-1-behavior.csv' },
      data: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        trial_number: String(n),
        phase: 'main',
        condition: conditions[n % conditions.length],
        reaction_time: String(200 + n),
        correct_response: correct,
        response_given: 'yes',
      })),
    },
  ];

  it('plots when correct_response is boolean true', () => {
    const result = aggregateDataForPlot(
      makeDataset(true),
      'RT',
      true,
      'errorbars'
    );
    expect(result).toBeTruthy();
    expect(result.dataToPlot).toBeTruthy();
  });

  it('does not throw when every trial is marked incorrect', () => {
    expect(() =>
      aggregateDataForPlot(makeDataset(false), 'RT', true, 'errorbars')
    ).not.toThrow();
  });

  it.each(['datapoints', 'errorbars', 'whiskers'])(
    'gives each of three conditions a distinct color (%s)',
    (displayMode) => {
      const { dataToPlot } = aggregateDataForPlot(
        makeDataset(true, ['Match', 'Mismatch', 'Neutral']),
        'Response Time',
        false,
        displayMode
      );
      const colors = dataToPlot.map((trace) => trace.marker.color);
      expect(colors).toHaveLength(3);
      expect(colors.every(Boolean)).toBe(true);
      expect(new Set(colors).size).toBe(3);
    }
  );

  it('plots legacy Stroop rows that only carry lab.js fields', () => {
    // Shape of a real pre-fix Stroop CSV (dano-test-1-behavior.csv): no
    // trial_number / reaction_time / correct_response / response_given.
    const stroopRow = (i, congruent, correct, phase = 'task') => ({
      sender: 'Stroop screen',
      sender_id: `0_3_0_${i}_1`,
      color: 'red',
      ...(phase === 'task' ? { congruent } : {}),
      correct,
      correctResponse: 'red',
      duration: String(600 + i * 10 + 0.4000000022352),
      ended_on: 'response',
      phase,
      response: correct === 'true' ? 'red' : 'blue',
      response_action: 'keydown(r)',
    });
    const rows = [
      stroopRow(0, undefined, 'true', 'practice'),
      { sender: 'Inter-trial interval', sender_id: '0_3_0_0_2', phase: 'task' },
      ...[0, 1, 2, 3, 4, 5].map((i) =>
        stroopRow(i, i % 2 ? 'yes' : 'no', i === 4 ? 'false' : 'true')
      ),
    ];
    const dataset = [
      { meta: { datafile: '/tmp/dano-test-1-behavior.csv' }, data: rows },
    ];
    const rt = aggregateDataForPlot(dataset, 'RT', false, 'datapoints');
    const ys = Object.fromEntries(
      rt.dataToPlot.map((trace) => [trace.name, trace.y])
    );
    expect(ys).toEqual({ Match: [610, 630, 650], Mismatch: [600, 620] });

    const accuracy = aggregateDataForPlot(
      dataset,
      'Accuracy',
      false,
      'errorbars'
    );
    expect(accuracy.dataToPlot.map((trace) => trace.name).sort()).toEqual([
      'Match',
      'Mismatch',
    ]);
  });

  it('pools Multitasking sessions saved under the old condition names', () => {
    const session = (file, single, mixed) => ({
      meta: { datafile: `/tmp/${file}-behavior.csv` },
      data: [1, 2, 3, 4].map((n) => ({
        trial_number: String(n),
        condition: n % 2 ? single : mixed,
        reaction_time: String(n % 2 ? 500 : 700),
        correct_response: 'true',
        response_given: 'yes',
      })),
    });
    const aggregated = {
      meta: {
        datafile: '/tmp/class-aggregated.csv',
        fields: ['RT_No switching', 'RT_Switching'],
      },
      data: [{ 'RT_No switching': '520', 'RT_Switching': '720' }],
    };
    const { dataToPlot } = aggregateDataForPlot(
      [
        session('old-a-1', 'No switching', 'Switching'),
        session('new-a-1', 'Single rule', 'Mixed rules'),
        aggregated,
      ],
      'RT',
      false,
      'datapoints',
      RENAMED_CONDITIONS[EXPERIMENTS.MULTI]
    );
    const ys = Object.fromEntries(
      dataToPlot.map((trace) => [trace.name, [...trace.y].sort()])
    );
    expect(ys).toEqual({
      'Single rule': [500, 500, 500, 500, 520],
      'Mixed rules': [700, 700, 700, 700, 720],
    });
  });
});
