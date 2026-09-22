/**
 * The adopted marker timing rule (CONTEXT.md "Marker timing rule"): a marker is
 * buffered as {code, timestamp} and attached to the one sample whose interval
 * contains the timestamp — error bounded to one sample interval. These cases
 * mirror muse.test.ts, which is the executable spec the three adapters share.
 */
import { describe, it, expect } from 'vitest';
import { createMarkerStamper } from '../markerRegistry';
import type { EEGData } from '../../../constants/interfaces';

const INTERVAL = 1000 / 256;
const sample = (timestamp: number): EEGData => ({ data: [0], timestamp });

describe('createMarkerStamper', () => {
  it.each([
    [
      'containing interval',
      1005,
      [1000, 1003.9, 1007.8],
      [undefined, 42, undefined],
    ],
    ['next sample for a late marker', 2000, [2010], [42]],
  ])('stamps the %s', (_name, markerTime, sampleTimes, expected) => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(42, markerTime);
    expect(sampleTimes.map((t) => stamper.stamp(sample(t)).marker)).toEqual(
      expected
    );
  });

  it('lets a newer injection replace an un-stamped one', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(1, 1005);
    stamper.inject(2, 1005);
    expect(stamper.stamp(sample(1003.9)).marker).toBe(2);
  });
});
