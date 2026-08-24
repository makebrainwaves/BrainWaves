import { describe, expect, it } from 'vitest';
import { aggregateDataForPlot } from '../compute';

describe('aggregateDataForPlot', () => {
  it('does not throw when given a Promise instead of an array', () => {
    expect(() =>
      aggregateDataForPlot(Promise.resolve([]), 'RT', true, false, 'errorbars')
    ).not.toThrow();
  });

  const makeDataset = (correct) => [
    {
      meta: { datafile: '/tmp/sub-grp-1-behavior.csv' },
      data: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        trial_number: String(n),
        phase: 'main',
        condition: 'Faces',
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
      false,
      'errorbars'
    );
    expect(result).toBeTruthy();
    expect(result.dataToPlot).toBeTruthy();
  });

  it('does not throw when every trial is marked incorrect', () => {
    expect(() =>
      aggregateDataForPlot(makeDataset(false), 'RT', true, false, 'errorbars')
    ).not.toThrow();
  });
});
