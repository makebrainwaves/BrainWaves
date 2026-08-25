/**
 * jsPsych trial rows -> the behavioral schema `utils/behavior/compute.js`
 * consumes.
 *
 * WHAT compute.js ACTUALLY REQUIRES (nothing else enforces it):
 *   - `filterData` (compute.js:127) drops rows with a FALSY `trial_number`, and
 *     jsPsych's `trial_index` is 0-based — so it must become 1-based or the
 *     first trial of every session disappears.
 *   - `correct_response` is compared against the STRING 'true', and
 *     `response_given` against 'yes'/'no'.
 *   - a `phase` of exactly 'practice' is excluded from analysis.
 *   - every RT and accuracy plot filters `correct_response === 'true'`, so a
 *     study with no correctness field would plot nothing. That is why
 *     `correctKey: ''` is an explicit teacher choice meaning "not measured —
 *     count every trial as correct", not a silent default.
 *
 * The jsPsych `data` parameter's keys arrive FLAT on each row: Trial.ts:216-222
 * spreads `getDataParameter()` into the result alongside `trial_type`,
 * `trial_index`, and `plugin_version`. (At `on_trial_start` the same keys are
 * still nested under `trialObject.data` and unresolved — see host.ts.)
 */
import Papa from 'papaparse';

export interface BehavioralRow {
  trial_number: number;
  condition: string;
  reaction_time: number | '';
  response_given: 'yes' | 'no';
  correct_response: 'true' | 'false';
  phase: string;
  trial_type: string;
  time_elapsed: number | '';
}

export interface BehavioralMapping {
  /** Author `data` key holding the condition label; '' emits a blank column. */
  conditionKey: string;
  /** Author `data` key holding correctness; '' means "not measured". */
  correctKey: string;
}

const DEFAULT_PHASE = 'test';

export const BEHAVIORAL_COLUMNS: (keyof BehavioralRow)[] = [
  'trial_number',
  'condition',
  'reaction_time',
  'response_given',
  'correct_response',
  'phase',
  'trial_type',
  'time_elapsed',
];

export const normalizeJsPsychTrials = (
  trials: Record<string, unknown>[],
  { conditionKey, correctKey }: BehavioralMapping
): BehavioralRow[] =>
  trials.map((trial, index) => {
    const rt = trial.rt;
    const responded = typeof rt === 'number' && Number.isFinite(rt);
    const trialIndex = trial.trial_index;
    const timeElapsed = trial.time_elapsed;
    const condition = conditionKey === '' ? undefined : trial[conditionKey];
    const phase = trial.phase;

    return {
      trial_number: typeof trialIndex === 'number' ? trialIndex + 1 : index + 1,
      condition: condition == null ? '' : String(condition),
      reaction_time: responded ? (rt as number) : '',
      response_given: responded ? 'yes' : 'no',
      correct_response:
        correctKey === '' || trial[correctKey] ? 'true' : 'false',
      phase:
        typeof phase === 'string' && phase.length > 0 ? phase : DEFAULT_PHASE,
      trial_type: typeof trial.trial_type === 'string' ? trial.trial_type : '',
      time_elapsed: typeof timeElapsed === 'number' ? timeElapsed : '',
    };
  });

export const toBehavioralCsv = (rows: BehavioralRow[]): string => {
  if (rows.length === 0) {
    return BEHAVIORAL_COLUMNS.join(',');
  }
  return Papa.unparse(rows, { columns: BEHAVIORAL_COLUMNS });
};
