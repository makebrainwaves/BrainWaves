import type { ExperimentParameters, Prediction } from '../constants/interfaces';
import { CONDITION_SLOTS, conditionTitle } from './labjs/customStimuli';

export type PredictionMeasure = Prediction['measure'];
export type PredictionDirection = Prediction['direction'];

/** One answer to a prediction question, in student words. */
export interface PredictionOption {
  direction: PredictionDirection;
  label: string;
}

/**
 * What a student can predict: one condition pair and measure, a question,
 * 2–3 answers, and one sentence on what to look for in Analyze. Built-ins
 * author it in `prepare.ts`; Custom builds it with `customPredictionContent`.
 */
export interface PredictionContent {
  question: string;
  conditions: [string, string];
  measure: PredictionMeasure;
  options: PredictionOption[];
  lookFor: string;
}

/** What an experiment lets a student predict: a built-in's fixed content, or Custom's own conditions and measures. */
export type PredictionOffer =
  | { kind: 'built-in'; content: PredictionContent }
  | { kind: 'custom'; conditions: string[]; measures: PredictionMeasure[] };

/** A saved prediction read against what the experiment offers now. `stale` means it names a condition or measure that no longer exists. */
export type PredictionState =
  | { status: 'none' }
  | { status: 'stale' }
  | {
      status: 'set';
      measure: PredictionMeasure;
      line: string;
      lookFor: string;
    };

/** Measure names in Custom's picker. */
export const MEASURE_NAMES: Record<PredictionMeasure, string> = {
  rt: 'Response time',
  accuracy: 'Accuracy',
  erp: 'Brain response (ERP)',
};

/** Custom's wording per measure: `more(x, y)` reads "x is the bigger one". */
const CUSTOM_WORDING: Record<
  PredictionMeasure,
  {
    question: (a: string, b: string) => string;
    more: (x: string, y: string) => string;
    same: string;
    lookFor: (a: string, b: string) => string;
  }
> = {
  rt: {
    question: (a, b) =>
      `Will people answer more slowly on ${a} or ${b} trials?`,
    more: (x, y) => `${x} slower than ${y}`,
    same: 'about the same speed',
    lookFor: (a, b) =>
      `With Measure on Response time, compare the ${a} bars with the ${b} bars: taller means slower.`,
  },
  accuracy: {
    question: (a, b) =>
      `Will people answer more accurately on ${a} or ${b} trials?`,
    more: (x, y) => `${x} more accurate than ${y}`,
    same: 'about as accurate',
    lookFor: (a, b) =>
      `With Measure on Accuracy, compare the ${a} bars with the ${b} bars: taller means more correct answers.`,
  },
  erp: {
    question: (a, b) =>
      `Whose average brain response will sit higher on the ERP: ${a} or ${b}?`,
    more: (x, y) => `${x} higher than ${y}`,
    same: 'about the same',
    lookFor: (a, b) =>
      `Pick a sensor and compare the ${a} line with the ${b} line: where one sits clearly higher, the brain responded differently.`,
  },
};

/** Custom's prediction content for a pair of its conditions and a measure, worded from their names. */
export function customPredictionContent(
  conditions: [string, string],
  measure: PredictionMeasure
): PredictionContent {
  const [a, b] = conditions;
  const wording = CUSTOM_WORDING[measure];
  return {
    question: wording.question(a, b),
    conditions,
    measure,
    options: [
      { direction: 'a>b', label: wording.more(a, b) },
      { direction: 'a=b', label: `${a} and ${b} ${wording.same}` },
      { direction: 'a<b', label: wording.more(b, a) },
    ],
    lookFor: wording.lookFor(a, b),
  };
}

/**
 * Custom's offer: every condition the student has started (named or given a
 * folder), under the name its data is recorded with, and the brain response
 * only when the workspace records EEG.
 */
export function customPredictionOffer(
  params: ExperimentParameters,
  isEEGEnabled: boolean
): Extract<PredictionOffer, { kind: 'custom' }> {
  const names = CONDITION_SLOTS.flatMap(({ name }) => {
    const slot = params[name];
    return slot && (slot.title?.trim() || slot.dir || slot.audioDir)
      ? [conditionTitle(slot)]
      : [];
  });
  return {
    kind: 'custom',
    conditions: [...new Set(names)],
    measures: isEEGEnabled ? ['rt', 'accuracy', 'erp'] : ['rt', 'accuracy'],
  };
}

/** True when `saved` answers `content`'s question: same condition pair, in order, and the same measure. */
export const isAnswerTo = (
  saved: Prediction | undefined,
  content: PredictionContent
): saved is Prediction =>
  saved?.measure === content.measure &&
  content.conditions.every((name, i) => name === saved.conditions[i]);

/** The content `saved` is an answer to, while everything it names is still offered. */
function contentFor(
  saved: Prediction,
  offer: PredictionOffer
): PredictionContent | undefined {
  if (offer.kind === 'built-in') {
    return isAnswerTo(saved, offer.content) ? offer.content : undefined;
  }
  const [a, b] = saved.conditions;
  return a !== b &&
    offer.conditions.includes(a) &&
    offer.conditions.includes(b) &&
    offer.measures.includes(saved.measure)
    ? customPredictionContent(saved.conditions, saved.measure)
    : undefined;
}

/** Reads `params.prediction` against the experiment's current offer. */
export function readPrediction(
  saved: Prediction | undefined,
  offer: PredictionOffer
): PredictionState {
  if (!saved) return { status: 'none' };
  const content = contentFor(saved, offer);
  const option = content?.options.find(
    ({ direction }) => direction === saved.direction
  );
  return content && option
    ? {
        status: 'set',
        measure: saved.measure,
        line: option.label,
        lookFor: content.lookFor,
      }
    : { status: 'stale' };
}
