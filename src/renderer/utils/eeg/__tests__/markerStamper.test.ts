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
  it('attaches the marker to the sample whose interval contains its timestamp', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(42, 1005);
    const seen = [1000, 1003.9, 1007.8].map((t) => stamper.stamp(sample(t)));
    expect(seen[0].marker).toBeUndefined();
    expect(seen[1].marker).toBe(42);
    expect(seen[2].marker).toBeUndefined();
  });

  it('does not attach before the containing interval', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(77, 1015);
    const seen = [1000, 1003.9, 1007.8, 1011.7].map((t) =>
      stamper.stamp(sample(t))
    );
    expect(seen.slice(0, 3).every((s) => s.marker === undefined)).toBe(true);
    expect(seen[3].marker).toBe(77);
  });

  it('attaches a late marker to the next sample', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(5, 2000);
    expect(stamper.stamp(sample(2010)).marker).toBe(5);
  });

  it('lets a newer injection replace an un-stamped one', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(1, 1005);
    stamper.inject(2, 1005);
    expect(stamper.stamp(sample(1003.9)).marker).toBe(2);
  });

  it('clear() drops a pending marker', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(9, 1005);
    stamper.clear();
    expect(stamper.stamp(sample(1003.9)).marker).toBeUndefined();
  });
});
