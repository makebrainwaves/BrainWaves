import type { SuggestedRejection } from '../../actions';

export {
  EXAMPLE_EPOCH_ARRAYS,
  FACES_HOUSES_CODE_TO_LABEL,
  MUSE_CHANNEL_INFO,
  WORKSPACE_TITLE,
} from '../Analyze/fixtures';
export type { EpochArrays } from '../Analyze/fixtures';

/** A raw EEG recording as `readWorkspaceRawEEGData` lists it (`<subject>-<group>-<session>-raw.csv`). */
export interface RawRecording {
  key: string;
  subject: string;
  /** File name shown in the list. */
  name: string;
  /** How long the run lasted. */
  duration: string;
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
    duration: '4 min · 84 trials',
    incomplete: false,
  },
  {
    key: 'P01-A-2',
    subject: 'P01',
    name: 'P01-A-2-raw.csv',
    duration: '4 min · 84 trials',
    incomplete: false,
  },
  {
    key: 'P02-A-1',
    subject: 'P02',
    name: 'P02-A-1-raw.csv',
    duration: '3 min · 62 trials',
    incomplete: false,
  },
  {
    key: 'P02-A-2',
    subject: 'P02',
    name: 'P02-A-2-raw.incomplete.csv',
    duration: '2 min · experiment ended early',
    incomplete: true,
  },
  {
    key: 'P03-A-1',
    subject: 'P03',
    name: 'P03-A-1-raw.incomplete.csv',
    duration: '30 s · experiment ended early',
    incomplete: true,
  },
];

/**
 * Auto-flag output for the example epochs, in the shape Python's
 * `suggest_rejections` returns: one artifact suggestion per noisy trial.
 * Suggestions are never applied on their own — the student accepts them.
 * Reasons are short enough for the rail's one-line rows.
 */
export const SUGGESTED_REJECTIONS: SuggestedRejection[] = [
  { index: 3, reason: '212 µV peak-to-peak at AF7' },
  { index: 12, reason: '189 µV peak-to-peak at TP9' },
  { index: 27, reason: '176 µV peak-to-peak at AF7' },
];
