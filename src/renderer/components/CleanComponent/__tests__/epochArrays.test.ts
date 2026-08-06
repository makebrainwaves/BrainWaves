/**
 * Tests for the pure epoch-array helpers backing the (read-only) EpochReviewer.
 * These decode the C-order [epoch][channel][time] Float32 buffer, downsample
 * traces while preserving spikes, and map event codes to a stable condition
 * color index.
 */
import { describe, it, expect } from 'vitest';
import type { EpochArraysMeta } from '../../../actions';
import {
  conditionIndexForCode,
  downsampleMinMax,
  epochChannelSeries,
  meanTrace,
} from '../epochArrays';

const makeMeta = (over: Partial<EpochArraysMeta> = {}): EpochArraysMeta => ({
  n_epochs: 2,
  n_channels: 2,
  n_times: 3,
  ch_names: ['A', 'B'],
  sfreq: 100,
  times: [0, 0.01, 0.02],
  event_codes: [1, 2],
  drop_log: [[], []],
  ...over,
});

describe('epochChannelSeries', () => {
  it('slices the correct 3 values for each (epoch, channel)', () => {
    const meta = makeMeta();
    // C-order [epoch][channel][time]: e0c0, e0c1, e1c0, e1c1
    const data = Float32Array.from([
      1,
      2,
      3, // epoch 0, channel 0
      4,
      5,
      6, // epoch 0, channel 1
      7,
      8,
      9, // epoch 1, channel 0
      10,
      11,
      12, // epoch 1, channel 1
    ]);
    const { buffer } = data;

    expect(Array.from(epochChannelSeries(buffer, meta, 0, 0))).toEqual([
      1, 2, 3,
    ]);
    expect(Array.from(epochChannelSeries(buffer, meta, 0, 1))).toEqual([
      4, 5, 6,
    ]);
    expect(Array.from(epochChannelSeries(buffer, meta, 1, 0))).toEqual([
      7, 8, 9,
    ]);
    expect(Array.from(epochChannelSeries(buffer, meta, 1, 1))).toEqual([
      10, 11, 12,
    ]);
  });

  it('returns a zero-copy view onto the underlying buffer', () => {
    const meta = makeMeta();
    const data = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const view = epochChannelSeries(data.buffer, meta, 1, 1);
    expect(view.buffer).toBe(data.buffer);
  });
});

describe('downsampleMinMax', () => {
  it('preserves a sharp spike as the max of its bucket', () => {
    // Flat baseline with one large spike partway through.
    const series = [0, 0, 0, 0, 99, 0, 0, 0];
    const out = downsampleMinMax(series, 2);
    // The spike must appear as a max in one of the buckets.
    const maxes = out.map(([, hi]) => hi);
    expect(Math.max(...maxes)).toBe(99);
    expect(out.length).toBeLessThanOrEqual(2);
  });

  it('emits one [v, v] per sample when width >= length', () => {
    const series = [3, 7, 5];
    expect(downsampleMinMax(series, 10)).toEqual([
      [3, 3],
      [7, 7],
      [5, 5],
    ]);
    // Exactly-equal width also yields per-sample pairs.
    expect(downsampleMinMax(series, 3)).toEqual([
      [3, 3],
      [7, 7],
      [5, 5],
    ]);
  });

  it('returns [] for an empty series', () => {
    expect(downsampleMinMax([], 5)).toEqual([]);
  });

  it('returns [] for width <= 0', () => {
    expect(downsampleMinMax([1, 2, 3], 0)).toEqual([]);
    expect(downsampleMinMax([1, 2, 3], -4)).toEqual([]);
  });

  it('never emits more columns than requested width', () => {
    const series = Array.from({ length: 100 }, (_, i) => i);
    const out = downsampleMinMax(series, 7);
    expect(out.length).toBeLessThanOrEqual(7);
    // Each entry is a [min, max] pair with min <= max.
    out.forEach(([lo, hi]) => expect(lo).toBeLessThanOrEqual(hi));
  });
});

describe('conditionIndexForCode', () => {
  it('maps codes to their position in the sorted-unique list', () => {
    const codes = [1, 2, 5];
    expect(conditionIndexForCode(1, codes)).toBe(0);
    expect(conditionIndexForCode(2, codes)).toBe(1);
    expect(conditionIndexForCode(5, codes)).toBe(2);
  });

  it('returns 0 for an unknown code', () => {
    expect(conditionIndexForCode(99, [1, 2, 5])).toBe(0);
  });
});

describe('meanTrace', () => {
  // n_epochs=3, n_channels=2, n_times=2 in C-order [epoch][channel][time].
  // channel 0 across epochs = [2,4], [4,8], [6,12] -> mean over all 3 = [4, 8].
  // channel 1 across epochs = [1,1], [3,3], [5,5]  -> mean over all 3 = [3, 3].
  const makeErpFixture = () => {
    const meta = makeMeta({
      n_epochs: 3,
      n_channels: 2,
      n_times: 2,
      times: [0, 0.01],
      event_codes: [1, 2, 1],
      drop_log: [[], [], []],
    });
    const data = Float32Array.from([
      2,
      4, // epoch 0, channel 0
      1,
      1, // epoch 0, channel 1
      4,
      8, // epoch 1, channel 0
      3,
      3, // epoch 1, channel 1
      6,
      12, // epoch 2, channel 0
      5,
      5, // epoch 2, channel 1
    ]);
    return { meta, buffer: data.buffer };
  };

  it('averages a channel over all epochs (exact mean)', () => {
    const { meta, buffer } = makeErpFixture();
    expect(Array.from(meanTrace(buffer, meta, [0, 1, 2], 0))).toEqual([4, 8]);
  });

  it('averages the correct subset of epochs', () => {
    const { meta, buffer } = makeErpFixture();
    // mean of epoch 0 ([2,4]) and epoch 2 ([6,12]) = [4, 8].
    expect(Array.from(meanTrace(buffer, meta, [0, 2], 0))).toEqual([4, 8]);
    // mean of epoch 0 ([2,4]) and epoch 1 ([4,8]) = [3, 6].
    expect(Array.from(meanTrace(buffer, meta, [0, 1], 0))).toEqual([3, 6]);
  });

  it('returns a length-n_times all-zero trace for an empty selection', () => {
    const { meta, buffer } = makeErpFixture();
    const out = meanTrace(buffer, meta, [], 0);
    expect(out.length).toBe(meta.n_times);
    expect(Array.from(out)).toEqual([0, 0]);
  });

  it('returns exactly that epoch series for a single-epoch selection', () => {
    const { meta, buffer } = makeErpFixture();
    const single = Array.from(meanTrace(buffer, meta, [1], 0));
    const series = Array.from(epochChannelSeries(buffer, meta, 1, 0));
    expect(single).toEqual(series);
    expect(single).toEqual([4, 8]);
  });

  it('reads the requested channel (channel 1 differs from channel 0)', () => {
    const { meta, buffer } = makeErpFixture();
    expect(Array.from(meanTrace(buffer, meta, [0, 1, 2], 1))).toEqual([3, 3]);
    expect(Array.from(meanTrace(buffer, meta, [0, 1, 2], 0))).not.toEqual([
      3, 3,
    ]);
  });
});
