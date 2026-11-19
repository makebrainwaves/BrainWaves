/**
 * The adopted marker timing rule (CONTEXT.md "Marker timing rule"): a marker is
 * buffered as {code, timestamp} and attached to the one sample whose interval
 * contains the timestamp — error bounded to one sample interval. The three
 * adapters share this rule; muse.test.ts checks it end to end against a
 * simulated headset clock.
 */
import { describe, it, expect, vi } from 'vitest';
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

  it('warns, and keeps counting, when the sample clock already passed the marker', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(1, 1005);
    [1000, 1003.9].forEach((t) => stamper.stamp(sample(t)));
    expect(warn).not.toHaveBeenCalled();

    stamper.inject(2, 2000);
    expect(stamper.stamp(sample(2010)).marker).toBe(2);
    stamper.inject(3, 3000);
    stamper.stamp(sample(3050));
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][0]).toContain('2 late');
    warn.mockRestore();
  });
});
