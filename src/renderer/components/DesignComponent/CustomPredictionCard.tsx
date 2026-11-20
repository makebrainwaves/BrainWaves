import React, { useState } from 'react';
import type {
  ExperimentParameters,
  Prediction,
} from '../../constants/interfaces';
import {
  MEASURE_NAMES,
  PredictionMeasure,
  customPredictionContent,
  customPredictionOffer,
  readPrediction,
} from '../../utils/prediction';
import { PredictionChoices } from '../PrepareSteps/PrepareSteps';

interface Props {
  params: ExperimentParameters;
  isEEGEnabled: boolean;
  /** Saves the prediction; called once a direction is picked, and again when its pair or measure changes. */
  onChange: (prediction: Prediction) => void;
}

const SELECT = 'rounded border border-gray-300 px-2 py-1';

/**
 * Custom's "Make a prediction" card, beside the hypothesis: two of the
 * student's conditions, a measure, and a direction worded from their names.
 * A saved prediction naming a renamed or removed condition (or the brain
 * response once EEG is off) is flagged and not shown as picked.
 */
export default function CustomPredictionCard({
  params,
  isEEGEnabled,
  onChange,
}: Props) {
  const offer = customPredictionOffer(params, isEEGEnabled);
  const { conditions: names, measures } = offer;
  const state = readPrediction(params.prediction, offer);
  const saved = state.status === 'set' ? params.prediction : undefined;
  /** The pair and measure being chosen before any direction is picked. */
  const [draft, setDraft] = useState<Omit<Prediction, 'direction'>>();

  const isOffered = (pair: [string, string]) =>
    pair[0] !== pair[1] && names.includes(pair[0]) && names.includes(pair[1]);
  const conditions: [string, string] = saved?.conditions ??
    (draft && isOffered(draft.conditions)
      ? draft.conditions
      : [names[0], names[1]]);
  const measure: PredictionMeasure =
    saved?.measure ??
    (draft && measures.includes(draft.measure) ? draft.measure : 'rt');

  function update(next: Omit<Prediction, 'direction'>) {
    if (saved) onChange({ ...next, direction: saved.direction });
    else setDraft(next);
  }

  function pick(slot: 0 | 1, name: string) {
    const other = conditions[1 - slot];
    const pair: [string, string] =
      name === other
        ? [conditions[1], conditions[0]]
        : slot === 0
          ? [name, other]
          : [other, name];
    update({ conditions: pair, measure });
  }

  const hypothesis = params.description?.hypothesis?.trim();
  const content = customPredictionContent(conditions, measure);

  return (
    <section className="flex flex-col gap-3 rounded border border-gray-300 bg-white p-3">
      <h2>Make a prediction</h2>
      {names.length < 2 ? (
        <p className="m-0 text-sm text-ink-muted">
          Name at least two conditions in the Conditions step, then come back
          to predict how they will differ.
        </p>
      ) : (
        <>
          {state.status === 'stale' && params.prediction && (
            <p role="status" className="m-0 text-sm text-amber-800">
              Your prediction needs an update: it compared{' '}
              {params.prediction.conditions.join(' and ')} on{' '}
              {MEASURE_NAMES[params.prediction.measure].toLowerCase()}, which
              no longer matches your design. Pick again below.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="prediction-a">Compare</label>
            <select
              id="prediction-a"
              className={SELECT}
              value={conditions[0]}
              onChange={(event) => pick(0, event.target.value)}
            >
              {names.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <label htmlFor="prediction-b">with</label>
            <select
              id="prediction-b"
              className={SELECT}
              value={conditions[1]}
              onChange={(event) => pick(1, event.target.value)}
            >
              {names.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <label htmlFor="prediction-measure">on</label>
            <select
              id="prediction-measure"
              className={SELECT}
              value={measure}
              onChange={(event) =>
                update({
                  conditions,
                  measure: event.target.value as PredictionMeasure,
                })
              }
            >
              {measures.map((value) => (
                <option key={value} value={value}>
                  {MEASURE_NAMES[value]}
                </option>
              ))}
            </select>
          </div>
          <PredictionChoices
            question={content.question}
            options={content.options}
            selected={saved?.direction}
            onSelect={(direction) =>
              onChange({ conditions, measure, direction })
            }
          />
        </>
      )}
      <p className="m-0 text-sm text-ink-muted">
        {hypothesis
          ? `Why: ${hypothesis}`
          : 'Write your hypothesis above: it is the reason for your prediction.'}
      </p>
    </section>
  );
}
