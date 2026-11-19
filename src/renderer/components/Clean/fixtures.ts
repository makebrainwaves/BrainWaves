import type { SuggestedRejection } from '../../actions';
import { epochChannelSeries } from '../CleanComponent/epochArrays';
import { EXAMPLE_EPOCH_ARRAYS as CLEANED_EPOCH_ARRAYS } from '../Analyze/fixtures';
import type { EpochArrays } from '../Analyze/fixtures';

export {
  FACES_HOUSES_CODE_TO_LABEL,
  MUSE_CHANNEL_INFO,
  WORKSPACE_TITLE,
} from '../Analyze/fixtures';
export type { EpochArrays };

/** A raw EEG recording as `readWorkspaceRawEEGData` lists it (`<subject>-<group>-<session>-raw.csv`). */
export interface RawRecording {
  key: string;
  subject: string;
  /** File name shown in the list. */
  name: string;
  /** Ended-early runs are renamed `*.incomplete.csv` and hidden from ordinary selection. */
  incomplete: boolean;
}

/**
 * Example workspace recordings: three complete runs Clean may offer, and two
 * ended-early runs (#275) kept as incomplete data but never cleaning
 * candidates.
 */
export const RAW_RECORDINGS: RawRecording[] = [
  {
    key: 'P01-A-1',
    subject: 'P01',
    name: 'P01-A-1-raw.csv',
    incomplete: false,
  },
  {
    key: 'P01-A-2',
    subject: 'P01',
    name: 'P01-A-2-raw.csv',
    incomplete: false,
  },
  {
    key: 'P02-A-1',
    subject: 'P02',
    name: 'P02-A-1-raw.csv',
    incomplete: false,
  },
  {
    key: 'P02-A-2',
    subject: 'P02',
    name: 'P02-A-2-raw.incomplete.csv',
    incomplete: true,
  },
  {
    key: 'P03-A-1',
    subject: 'P03',
    name: 'P03-A-1-raw.incomplete.csv',
    incomplete: true,
  },
];

/** Artifacts added to the example epochs, as `[trial, sensor, µV at time t (s)]`. */
const ARTIFACTS: [number, string, (t: number) => number][] = [
  // Blink: a slow one-sided swell on a frontal sensor.
  [3, 'AF7', (t) => 210 * Math.exp(-((t - 0.32) ** 2) / (2 * 0.07 ** 2))],
  // Jaw clench: a burst of fast muscle activity on an ear sensor.
  [
    12,
    'TP9',
    (t) =>
      90 *
      Math.sin(2 * Math.PI * 45 * t) *
      Math.exp(-((t - 0.5) ** 2) / (2 * 0.1 ** 2)),
  ],
  // Electrode pop: a sudden jump that slowly settles.
  [27, 'AF7', (t) => (t < 0.2 ? 0 : -170 * Math.exp(-(t - 0.2) / 0.25))],
];

/**
 * The example epochs as Clean sees them, before cleaning: Analyze's cleaned
 * trials plus a few obvious artifacts, so the reviewer shows what a noisy
 * trial looks like next to quiet ones. Synthetic.
 */
export const EXAMPLE_EPOCH_ARRAYS: EpochArrays = (() => {
  const { buffer, meta } = CLEANED_EPOCH_ARRAYS;
  const data = new Float32Array(buffer.slice(0));
  for (const [trial, sensor, artifact] of ARTIFACTS) {
    const offset =
      (trial * meta.n_channels + meta.ch_names.indexOf(sensor)) * meta.n_times;
    meta.times.forEach((t, i) => {
      data[offset + i] += artifact(t);
    });
  }
  return { buffer: data.buffer, meta };
})();

/**
 * Auto-flag output for the example epochs, in the shape Python's
 * `suggest_rejections` returns: one suggestion per artifact trial, with its
 * worst sensor's real peak-to-peak. Suggestions are never applied on their
 * own — the student accepts them.
 */
export const SUGGESTED_REJECTIONS: SuggestedRejection[] = ARTIFACTS.map(
  ([index, sensor]) => {
    const series = epochChannelSeries(
      EXAMPLE_EPOCH_ARRAYS.buffer,
      EXAMPLE_EPOCH_ARRAYS.meta,
      index,
      EXAMPLE_EPOCH_ARRAYS.meta.ch_names.indexOf(sensor)
    );
    const ptp = Math.max(...series) - Math.min(...series);
    return { index, reason: `peak-to-peak ${Math.round(ptp)}µV on ${sensor}` };
  }
);
