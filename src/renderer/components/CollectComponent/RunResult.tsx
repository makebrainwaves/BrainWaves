import React from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

interface Props {
  /** `saving` covers the gap between an early exit and its result. */
  outcome: 'complete' | 'incomplete' | 'saving';
  modality: 'eeg' | 'behavior';
  subject: string;
  onClean?(): void;
  onAnalyze?(): void;
  onRunAnother?(): void;
  onRunAgain?(): void;
}

/**
 * What the student running the experiment sees after a run: a complete run
 * recommends Clean (EEG) or Analyze (behavior only); an early exit says so and
 * never reads as finished. Pure props; the caller owns navigation.
 */
export default function RunResult({
  outcome,
  modality,
  subject,
  onClean,
  onAnalyze,
  onRunAnother,
  onRunAgain,
}: Props) {
  const eeg = modality === 'eeg';
  return (
    <div
      aria-live="polite"
      className="flex h-full flex-col items-center justify-center gap-4 text-center"
    >
      {outcome === 'saving' && (
        <>
          <Spinner size={40} aria-hidden />
          <h1 className="m-0">Saving what was recorded…</h1>
        </>
      )}
      {outcome === 'complete' && (
        <>
          <h1 className="m-0">
            {eeg ? 'Recording complete' : 'Run complete'}
          </h1>
          <p className="m-0 max-w-[560px] text-ink-muted">
            {eeg ? (
              <>
                Saved <b className="text-ink">{subject}</b>&apos;s EEG and key
                presses. Clean the recording next to remove noise.
              </>
            ) : (
              <>
                Saved <b className="text-ink">{subject}</b>&apos;s key presses.
                No EEG was recorded, so the results are ready to analyze.
              </>
            )}
          </p>
          <div className="mt-2 flex gap-3">
            {eeg ? (
              <Button size="lg" onClick={onClean}>
                Clean this recording →
              </Button>
            ) : (
              <Button size="lg" onClick={onAnalyze}>
                Analyze results →
              </Button>
            )}
            <Button size="lg" variant="outline-brand" onClick={onRunAnother}>
              Run another participant
            </Button>
          </div>
        </>
      )}
      {outcome === 'incomplete' && (
        <>
          <h1 className="m-0">Experiment ended early</h1>
          <p className="m-0 max-w-[560px] text-ink-muted">
            {eeg ? 'The EEG and key presses' : 'The key presses'} recorded for{' '}
            <b className="text-ink">{subject}</b> are kept, but marked
            incomplete. They won&apos;t appear in Clean or Analyze.
          </p>
          <div className="mt-2">
            <Button size="lg" onClick={onRunAgain}>
              Run again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
