import { EXPERIMENTS } from './constants';

/** Human-readable template names. Enum values are folder-safe, these are not. */
const LABELS: Record<EXPERIMENTS, string> = {
  [EXPERIMENTS.NONE]: 'Experiment',
  [EXPERIMENTS.N170]: 'Faces/Houses',
  [EXPERIMENTS.STROOP]: 'Stroop',
  [EXPERIMENTS.MULTI]: 'Multi-tasking',
  [EXPERIMENTS.SEARCH]: 'Visual Search',
  [EXPERIMENTS.CUSTOM]: 'Custom',
  [EXPERIMENTS.IMPORTED]: 'Imported',
};

export const experimentLabel = (type: EXPERIMENTS): string =>
  LABELS[type] ?? 'Experiment';
