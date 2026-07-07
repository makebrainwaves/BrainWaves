import type { EpochArraysMeta } from '../../actions';

// Buffer is C-order [epoch][channel][time]. Return the time series for one
// (epoch, channel) as a zero-copy subarray view.
export function epochChannelSeries(
  buffer: ArrayBuffer,
  meta: EpochArraysMeta,
  epoch: number,
  channel: number
): Float32Array {
  const floats = new Float32Array(buffer);
  const stride = meta.n_channels * meta.n_times;
  const start = epoch * stride + channel * meta.n_times;
  return floats.subarray(start, start + meta.n_times);
}

// Downsample to at most `width` columns, preserving spikes by keeping the min
// AND max within each column (so a sharp transient is never averaged away).
// Returns [min, max] per column. width >= length => one [v, v] per sample.
export function downsampleMinMax(
  series: ArrayLike<number>,
  width: number
): Array<[number, number]> {
  const { length } = series;
  if (width <= 0 || length === 0) {
    return [];
  }

  // When we have at least as many columns as samples, there is nothing to
  // compress: emit one [v, v] per sample.
  if (width >= length) {
    const out: Array<[number, number]> = new Array(length);
    for (let i = 0; i < length; i += 1) {
      const v = series[i];
      out[i] = [v, v];
    }
    return out;
  }

  // Split the series into `width` contiguous buckets. Bucket boundaries are
  // computed with floating math so samples distribute as evenly as possible,
  // and every bucket is non-empty (guaranteed because width < length).
  const out: Array<[number, number]> = new Array(width);
  for (let col = 0; col < width; col += 1) {
    const start = Math.floor((col * length) / width);
    const end = Math.floor(((col + 1) * length) / width);
    let min = series[start];
    let max = series[start];
    for (let i = start + 1; i < end; i += 1) {
      const v = series[i];
      if (v < min) {
        min = v;
      }
      if (v > max) {
        max = v;
      }
    }
    out[col] = [min, max];
  }
  return out;
}

// Index into CONDITION_PALETTE by mapping an event code to its position in the
// sorted unique code list (stable, deterministic coloring per condition).
export function conditionIndexForCode(
  code: number,
  uniqueSortedCodes: number[]
): number {
  const i = uniqueSortedCodes.indexOf(code);
  return i < 0 ? 0 : i;
}
