import React, { useEffect, useState } from 'react';
import type { SuggestedRejection, SuggestRequest } from '../../actions';
import { PTP_THRESHOLD } from '../../constants/constants';
import EpochReviewer from '../CleanComponent/EpochReviewer';
import LiveErpPane from '../CleanComponent/LiveErpPane';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { RailSection, ResultStatus, railLabel } from '../Analyze/AnalyzeParts';
import { CleanLayout, ConfirmDialog, FitPane } from './CleanParts';
import { CleanPrimerPanel, PrimerPointer, PrimerStep } from './CleanPrimer';
import type { EpochArrays } from './fixtures';

/** Which `CleanComponent` confirmation is open, restyled as an in-app dialog. */
export type CleanConfirm =
  | 'rejectAll'
  | 'removeSelected'
  | 'applyChannels'
  | 'dropChannels';

/** One auto-flag suggestion with its review state. */
export interface CleanSuggestion extends SuggestedRejection {
  /** Left out by accepting this suggestion. A trial the student left out themselves is not accepted, even when a later list suggests it. */
  accepted: boolean;
}

/** Where the save stands. `idle` shows the two save actions. */
export type SaveState = 'idle' | 'saving' | 'failed' | 'saved';

export interface CleanReviewProps {
  /** Where the epochs came from, for the rail and the status copy. */
  dataset: { subject: string; recording: string };
  /** Epochs as `pyodide.epochArrays` holds them; null while loading. */
  epochArrays: EpochArrays | null;
  /** `loading` and `no-epochs` replace the review area and disable saving; the rail stays usable. */
  status: 'ready' | 'loading' | 'no-epochs';
  codeToLabel: Record<number, string>;
  /** ABSOLUTE epoch indices left out, including accepted suggestions. */
  rejected: Set<number>;
  badChannels: Set<string>;
  onToggleEpoch(index: number): void;
  onToggleChannel(name: string): void;
  autoFlagThreshold: number;
  onThresholdChange(value: number): void;
  suggestions: CleanSuggestion[];
  /** Threshold and flagged sensors the current suggestion list was computed for; null before the first list. */
  suggestedFor: SuggestRequest | null;
  onAcceptSuggestion(index: number): void;
  /** Accepts every listed suggestion not already left out. */
  onAcceptAllSuggestions(): void;
  onRestoreSuggestion(index: number): void;
  onSuggest(): void;
  saveState: SaveState;
  onApply(): void;
  onSave(): void;
  onRetrySave(): void;
  onGoToAnalyze(): void;
  onGoToCollect(): void;
  onBackToSelection(): void;
  confirm: CleanConfirm | null;
  onConfirmAccept(): void;
  onConfirmCancel(): void;
  primerOpen: boolean;
  primerStep: PrimerStep;
  onPrimerOpenChange(open: boolean): void;
  onPrimerStepChange(step: PrimerStep): void;
}

/** Says when the suggestion list no longer matches the slider or the flagged sensors; empty otherwise. */
function staleNote({
  suggestions,
  suggestedFor,
  autoFlagThreshold,
  badChannels,
}: CleanReviewProps) {
  if (suggestions.length === 0 || suggestedFor === null) return '';
  const sensorsChanged =
    suggestedFor.badChannels.length !== badChannels.size ||
    suggestedFor.badChannels.some((name) => !badChannels.has(name));
  if (sensorsChanged) {
    return ' The list below is from before you changed the flagged sensors — press Suggest to update it.';
  }
  if (suggestedFor.threshold !== autoFlagThreshold) {
    return ` The list below is for ${suggestedFor.threshold} µV — press Suggest to update it.`;
  }
  return '';
}

/**
 * Clean's review phase. The Epoch Reviewer fills the top of the working area
 * — it is the thing students click — with the primer docked beside it (never
 * over it) and a bottom row holding a legible Live ERP next to the auto-flag
 * suggestions it feeds. Everything fits the window with no page scroll. Pure
 * props; the real reviewer and ERP panes are rendered unmodified inside
 * `FitPane`.
 */
export default function CleanReview(props: CleanReviewProps) {
  const meta = props.epochArrays?.meta ?? null;
  const total = meta?.n_epochs ?? 0;
  const acceptedCount = props.suggestions.filter((s) => s.accepted).length;
  const kept = total - props.rejected.size;
  const { dataset } = props;
  const busy = props.saveState === 'saving';
  const [focus, setFocus] = useState<{ index: number } | null>(null);
  useEffect(() => setFocus(null), [props.epochArrays]);

  const rail = (
    <>
      <RailSection label="Dataset">
        <div className="text-[13px] leading-[1.35]">
          <div className="font-bold text-ink">{dataset.subject}</div>
          <div className="text-ink-muted">{dataset.recording}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={props.onBackToSelection}>
          ← Pick different data
        </Button>
      </RailSection>
      <RailSection
        label="Auto-flag"
        className="border-t border-gray-200 pt-[10px]"
      >
        <div className="flex items-center gap-[8px]">
          <span className="text-[11px] text-ink-muted">More flags</span>
          <input
            id="clean-autoflag-threshold"
            type="range"
            min={PTP_THRESHOLD.min}
            max={PTP_THRESHOLD.max}
            step={PTP_THRESHOLD.step}
            value={props.autoFlagThreshold}
            aria-valuetext={`${props.autoFlagThreshold} µV peak-to-peak`}
            onChange={(e) => props.onThresholdChange(Number(e.target.value))}
            disabled={busy}
            className="flex-1 accent-brand"
          />
          <span className="text-[11px] text-ink-muted">Fewer</span>
        </div>
        <div className="text-[11px] leading-[1.4] text-ink-muted">
          Suggests trials whose peak-to-peak amplitude goes over{' '}
          {props.autoFlagThreshold} µV.
          {staleNote(props)}
        </div>
        <Button
          variant="outline-brand"
          size="sm"
          disabled={busy}
          onClick={props.onSuggest}
        >
          Suggest noisy trials
        </Button>
      </RailSection>
      <RailSection
        label="Exclusions"
        className="border-t border-gray-200 pt-[10px]"
      >
        {total === 0 ? (
          <div className="text-[13px] text-ink-muted">
            Counts show up once the trials are loaded.
          </div>
        ) : (
          <div className="text-[13px] leading-[1.35] text-ink">
            <div>
              {props.rejected.size} of {total} trials left out
              {props.rejected.size > 0 &&
                (acceptedCount > 0 && props.rejected.size > acceptedCount
                  ? ` (${props.rejected.size - acceptedCount} by you, ${acceptedCount} suggested)`
                  : acceptedCount > 0
                    ? ' (all suggested)'
                    : ' (all by you)')}
            </div>
            <div>
              {props.badChannels.size === 0
                ? 'No sensors flagged'
                : `Sensor${props.badChannels.size === 1 ? '' : 's'} flagged: ${[
                    ...props.badChannels,
                  ].join(', ')}`}
            </div>
            <div className="font-bold">{kept} trials will be averaged</div>
          </div>
        )}
      </RailSection>
      <RailSection label="Save" className="border-t border-gray-200 pt-[10px]">
        {props.saveState === 'saving' && (
          <div role="status" className="flex items-center gap-[8px]">
            <Spinner size={20} aria-hidden />
            <div>
              <div className="text-[13px] font-bold text-ink">
                Saving your cleaned dataset…
              </div>
              <div className="text-[11px] leading-[1.35] text-ink-muted">
                Writing a cleaned copy. Your original recording is unchanged.
              </div>
            </div>
          </div>
        )}
        {props.saveState === 'failed' && (
          <div role="alert">
            <div className="text-[13px] font-bold text-red-700">
              Couldn&apos;t save the cleaned dataset
            </div>
            <div className="mt-[2px] text-[11px] leading-[1.35] text-ink-muted">
              Nothing was written — your original recording is unchanged.
            </div>
            <div className="mt-[6px] flex flex-col gap-[6px]">
              <Button size="sm" onClick={props.onRetrySave}>
                Try again
              </Button>
              <Button
                size="sm"
                variant="outline-brand"
                disabled={props.status !== 'ready'}
                onClick={props.onApply}
              >
                Apply exclusions
              </Button>
            </div>
          </div>
        )}
        {props.saveState === 'saved' && (
          <div role="status">
            <div className="text-[13px] font-bold text-ink">
              ✓ Cleaned dataset saved
            </div>
            <div className="mt-[2px] text-[11px] leading-[1.35] text-ink-muted">
              Your original recording is unchanged. The cleaned copy is ready to
              use in Analyze.
            </div>
            <Button
              size="sm"
              className="mt-[6px] w-full"
              onClick={props.onGoToAnalyze}
            >
              Go to Analyze →
            </Button>
          </div>
        )}
        {props.saveState === 'idle' && (
          <div className="flex flex-col gap-[6px]">
            <Button
              size="sm"
              disabled={props.status !== 'ready'}
              onClick={props.onSave}
            >
              Save cleaned dataset &amp; analyze
            </Button>
            <Button
              size="sm"
              variant="outline-brand"
              disabled={props.status !== 'ready'}
              onClick={props.onApply}
            >
              Apply exclusions
            </Button>
          </div>
        )}
      </RailSection>
    </>
  );

  let body: React.ReactNode;
  if (props.status === 'loading') {
    body = (
      <ResultStatus
        status="loading"
        title={`Loading ${dataset.recording}…`}
        body="Cutting the recording into trials so you can review them. This takes a few seconds."
      />
    );
  } else if (props.status === 'no-epochs') {
    body = (
      <div className="flex min-h-0 flex-1 flex-col items-start justify-center gap-[12px] rounded-lg border border-gray-200 bg-white p-[32px]">
        <h2 className="m-0 text-[24px] font-light text-ink">
          No trials to clean in this recording
        </h2>
        <div className="max-w-[560px] text-[16px] leading-[1.5] text-ink-muted">
          {dataset.recording} has no usable trials. That usually means the
          experiment ended before any stimulus appeared, or the trial markers
          were missing. Your original recording is unchanged.
        </div>
        <div className="flex gap-[8px]">
          <Button size="lg" onClick={props.onBackToSelection}>
            ← Pick different data
          </Button>
          <Button
            size="lg"
            variant="outline-brand"
            onClick={props.onGoToCollect}
          >
            Go to Collect
          </Button>
        </div>
      </div>
    );
  } else {
    const acceptable = props.suggestions.filter(
      (s) => !s.accepted && !props.rejected.has(s.index)
    ).length;
    body = (
      <div className="flex min-h-0 flex-1 gap-[12px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
          <div className="relative flex min-h-0 flex-1">
            <FitPane logicalWidth={640} logicalHeight={426} className="flex-1">
              <EpochReviewer
                epochArrays={props.epochArrays}
                rejected={props.rejected}
                onToggleEpoch={props.onToggleEpoch}
                badChannels={props.badChannels}
                onToggleChannel={props.onToggleChannel}
                codeToLabel={props.codeToLabel}
                focus={focus}
                laneMicrovolts={props.autoFlagThreshold}
              />
            </FitPane>
            {props.primerOpen && <PrimerPointer step={props.primerStep} />}
          </div>
          <section
            aria-label="Live ERP"
            className="flex h-[224px] flex-none flex-col rounded-lg border border-gray-200 bg-white px-[12px] pb-[8px] pt-[6px]"
          >
            <FitPane
              logicalWidth={640}
              logicalHeight={344}
              className="flex min-h-0 w-full flex-1 items-center justify-center"
            >
              <LiveErpPane
                epochArrays={props.epochArrays}
                rejected={props.rejected}
                codeToLabel={props.codeToLabel}
              />
            </FitPane>
          </section>
        </div>
        <div className="flex w-[320px] flex-none flex-col gap-[12px]">
          <CleanPrimerPanel
            open={props.primerOpen}
            step={props.primerStep}
            onStepChange={props.onPrimerStepChange}
            onOpenChange={props.onPrimerOpenChange}
            className="flex-none"
          />
          {props.suggestions.length > 0 && (
            <section
              aria-label="Auto-flag suggestions"
              className="flex min-h-[160px] flex-1 flex-col gap-[8px] rounded-lg border border-gray-200 bg-white p-[14px]"
            >
              <div className="flex items-center gap-[10px]">
                <span className={railLabel}>Suggested by auto-flag</span>
                <Button
                  size="sm"
                  variant="outline-brand"
                  className="ml-auto flex-none"
                  disabled={busy || acceptable === 0}
                  onClick={props.onAcceptAllSuggestions}
                >
                  Accept all
                </Button>
              </div>
              <ul className="m-0 flex min-h-0 flex-1 flex-col gap-[4px] overflow-y-auto p-0">
                {props.suggestions.map((suggestion) => (
                  <li
                    key={suggestion.index}
                    className="flex items-center gap-[10px] rounded-md border border-gray-200 px-[10px] py-[5px]"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-baseline gap-[8px]">
                        <button
                          type="button"
                          className="flex-none cursor-pointer border-0 bg-transparent p-0 text-[13px] font-bold text-ink underline decoration-dotted underline-offset-2 hover:text-brand"
                          aria-label={`Show trial ${suggestion.index}`}
                          onClick={() => setFocus({ index: suggestion.index })}
                        >
                          Trial {suggestion.index}
                        </button>
                        {(suggestion.accepted ||
                          props.rejected.has(suggestion.index)) && (
                          <span className="text-[12px] font-bold text-ink">
                            {suggestion.accepted
                              ? '✓ Left out'
                              : '✓ Left out by you'}
                          </span>
                        )}
                      </div>
                      <span className="truncate text-[12px] text-ink-muted">
                        {suggestion.reason}
                      </span>
                    </div>
                    {suggestion.accepted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-none"
                        disabled={busy}
                        onClick={() => {
                          setFocus({ index: suggestion.index });
                          props.onRestoreSuggestion(suggestion.index);
                        }}
                      >
                        Restore
                      </Button>
                    ) : props.rejected.has(suggestion.index) ? null : (
                      <Button
                        size="sm"
                        variant="outline-brand"
                        className="flex-none"
                        disabled={busy}
                        onClick={() => {
                          setFocus({ index: suggestion.index });
                          props.onAcceptSuggestion(suggestion.index);
                        }}
                      >
                        Accept
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    );
  }

  const confirmCopy: Record<
    CleanConfirm,
    { title: string; body: string; confirmLabel: string; destructive: boolean }
  > = {
    rejectAll: {
      title: 'Leave out every trial?',
      body: `This will reject all ${total} epochs, leaving nothing to analyze. Are you sure?`,
      confirmLabel: 'Reject all anyway',
      destructive: true,
    },
    removeSelected: {
      title: 'Remove the selected trials?',
      body: `This will remove ${props.rejected.size} selected epoch${props.rejected.size === 1 ? '' : 's'} before analysis. Continue?`,
      confirmLabel: 'Remove selected and analyze',
      destructive: false,
    },
    applyChannels: {
      title: 'Apply the flagged sensors?',
      body: 'This will apply flagged bad channels before analysis. Continue?',
      confirmLabel: 'Apply and analyze',
      destructive: false,
    },
    dropChannels: {
      title: 'More than one bad sensor flagged',
      body: "You've marked more than one bad channel on a 4-channel recording. That removes a big chunk of your data — if the signal is really this noisy, consider collecting another dataset.",
      confirmLabel: 'Got it',
      destructive: false,
    },
  };
  const dialog = props.confirm ? confirmCopy[props.confirm] : null;

  return (
    <CleanLayout title="Clean your data — review" rail={rail}>
      {body}
      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        body={dialog?.body ?? ''}
        confirmLabel={dialog?.confirmLabel ?? ''}
        destructive={dialog?.destructive}
        onConfirm={props.onConfirmAccept}
        onCancel={props.onConfirmCancel}
      />
    </CleanLayout>
  );
}
