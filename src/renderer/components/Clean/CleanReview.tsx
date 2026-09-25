import React from 'react';
import type { SuggestedRejection } from '../../actions';
import { PTP_THRESHOLD } from '../../constants/constants';
import EpochReviewer from '../CleanComponent/EpochReviewer';
import LiveErpPane from '../CleanComponent/LiveErpPane';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { RailSection, ResultStatus, railLabel } from '../Analyze/AnalyzeParts';
import { CleanLayout, ConfirmDialog } from './CleanParts';
import { CleanPrimer, PrimerPointer, PrimerStep } from './CleanPrimer';
import type { EpochArrays } from './fixtures';

/** Which `CleanComponent` confirmation is open, restyled as an in-app dialog. */
export type CleanConfirm =
  | 'rejectAll'
  | 'removeSelected'
  | 'applyChannels'
  | 'dropChannels';

/** One auto-flag suggestion with its review state. */
export interface CleanSuggestion extends SuggestedRejection {
  /** Accepted suggestions are excluded like the student's own clicks. */
  accepted: boolean;
}

/** Where the save stands. `idle` shows the two save actions. */
export type SaveState = 'idle' | 'saving' | 'failed' | 'saved';

export interface CleanReviewProps {
  /** Where the epochs came from, for the rail and the status copy. */
  dataset: { subject: string; recording: string };
  /** Epochs as `pyodide.epochArrays` holds them; null while loading. */
  epochArrays: EpochArrays | null;
  /** `loading` and `no-epochs` replace the pair; the rail stays usable. */
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
  onAcceptSuggestion(index: number): void;
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

/**
 * Clean's review phase: the Epoch Reviewer and the Live ERP as a coordinated
 * pair beside the controls rail, with the always-available primer, auto-flag
 * suggestions to review, and the save states. Everything fits the window with
 * no page scroll. Pure props; the real reviewer and ERP panes are rendered
 * unmodified.
 */
export default function CleanReview(props: CleanReviewProps) {
  const meta = props.epochArrays?.meta ?? null;
  const total = meta?.n_epochs ?? 0;
  const acceptedCount = props.suggestions.filter((s) => s.accepted).length;
  const kept = total - props.rejected.size;
  const { dataset } = props;

  const rail = (
    <>
      <RailSection label="Dataset">
        <div className="min-w-0 text-[14px]">
          <div className="font-bold text-ink">{dataset.subject}</div>
          <div className="truncate text-ink-muted">{dataset.recording}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={props.onBackToSelection}>
          ← Pick different data
        </Button>
      </RailSection>
      <RailSection label="Auto-flag" className="border-t border-gray-200 pt-[12px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] text-ink-muted">More flags</span>
          <input
            id="clean-autoflag-threshold"
            type="range"
            min={PTP_THRESHOLD.min}
            max={PTP_THRESHOLD.max}
            step={PTP_THRESHOLD.step}
            value={props.autoFlagThreshold}
            aria-valuetext={`${props.autoFlagThreshold} µV peak-to-peak`}
            onChange={(e) => props.onThresholdChange(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <span className="text-[12px] text-ink-muted">Fewer flags</span>
        </div>
        <div className="text-[12px] leading-[1.4] text-ink-muted">
          Suggests trials whose peak-to-peak amplitude goes over{' '}
          {props.autoFlagThreshold} µV.
        </div>
        <Button variant="outline-brand" size="sm" onClick={props.onSuggest}>
          Suggest noisy trials
        </Button>
      </RailSection>
      <RailSection label="Exclusions" className="border-t border-gray-200 pt-[12px]">
        {total === 0 ? (
          <div className="text-[14px] text-ink-muted">
            Counts show up once the trials are loaded.
          </div>
        ) : (
          <div className="text-[14px] leading-[1.5] text-ink">
          <div>
            {props.rejected.size} of {total} trials left out
            {props.rejected.size > 0 &&
              (acceptedCount > 0 && props.rejected.size > acceptedCount
                ? ` — ${props.rejected.size - acceptedCount} clicked by you, ${acceptedCount} accepted from suggestions`
                : acceptedCount > 0
                  ? ' — all accepted from suggestions'
                  : ' — all clicked by you')}
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
      <RailSection label="Save" className="border-t border-gray-200 pt-[12px]">
        {props.saveState === 'saving' && (
          <div role="status" className="flex items-center gap-[8px]">
            <Spinner size={20} aria-hidden />
            <div>
              <div className="text-[14px] font-bold text-ink">
                Saving your cleaned dataset…
              </div>
              <div className="text-[12px] leading-[1.4] text-ink-muted">
                Writing a cleaned copy. Your original recording is unchanged.
              </div>
            </div>
          </div>
        )}
        {props.saveState === 'failed' && (
          <div role="alert">
            <div className="text-[14px] font-bold text-red-700">
              Couldn&apos;t save the cleaned dataset
            </div>
            <div className="mt-[2px] text-[12px] leading-[1.4] text-ink-muted">
              Nothing was written — your original recording is unchanged.
            </div>
            <div className="mt-[6px] flex gap-[8px]">
              <Button size="sm" onClick={props.onRetrySave}>
                Try again
              </Button>
              <Button size="sm" variant="outline-brand" onClick={props.onApply}>
                Apply exclusions
              </Button>
            </div>
          </div>
        )}
        {props.saveState === 'saved' && (
          <div role="status">
            <div className="text-[14px] font-bold text-ink">
              ✓ Cleaned dataset saved
            </div>
            <div className="mt-[2px] text-[12px] leading-[1.4] text-ink-muted">
              Your original recording is unchanged. The cleaned copy is ready to
              use in Analyze.
            </div>
            <Button size="sm" className="mt-[6px] w-full" onClick={props.onGoToAnalyze}>
              Go to Analyze →
            </Button>
          </div>
        )}
        {props.saveState === 'idle' && (
          <div className="flex flex-col gap-[6px]">
            <Button size="sm" variant="outline-brand" onClick={props.onApply}>
              Apply exclusions
            </Button>
            <Button size="sm" onClick={props.onSave}>
              Save cleaned dataset &amp; analyze
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
          <Button size="lg" variant="outline-brand" onClick={props.onGoToCollect}>
            Go to Collect
          </Button>
        </div>
      </div>
    );
  } else {
    body = (
      <>
        <div className="relative flex min-h-0 flex-1 items-start gap-[16px]">
          <div className="bw-clean-fit w-[640px]">
            <EpochReviewer
              epochArrays={props.epochArrays}
              rejected={props.rejected}
              onToggleEpoch={props.onToggleEpoch}
              badChannels={props.badChannels}
              onToggleChannel={props.onToggleChannel}
              codeToLabel={props.codeToLabel}
            />
          </div>
          <div className="bw-clean-fit w-[640px]">
            <LiveErpPane
              epochArrays={props.epochArrays}
              rejected={props.rejected}
              codeToLabel={props.codeToLabel}
            />
          </div>
          {props.primerOpen && <PrimerPointer step={props.primerStep} />}
        </div>

        {props.suggestions.length > 0 && (
          <section
            aria-label="Auto-flag suggestions"
            className="flex-none rounded-lg border border-gray-200 bg-white px-[20px] py-[12px]"
          >
            <div className="flex items-baseline gap-[12px]">
              <span className={railLabel}>Suggested by auto-flag</span>
              <div className="text-[13px] text-ink-muted">
                Suggestions, not decisions — check each one before it goes into
                your cleaned data.
              </div>
              <div className="ml-auto flex-none text-[13px] text-ink-muted">
                {props.suggestions.length - acceptedCount} to review ·{' '}
                {acceptedCount} accepted
              </div>
            </div>
            <ul className="m-0 mt-[8px] flex flex-col gap-[4px] p-0">
              {props.suggestions.map((suggestion) => (
                <li
                  key={suggestion.index}
                  className="flex items-center gap-[12px] rounded-md border border-gray-200 px-[12px] py-[6px]"
                >
                  <span className="flex-none text-[14px] font-bold text-ink">
                    Trial {suggestion.index}
                  </span>
                  <span className="min-w-0 truncate text-[13px] text-ink-muted">
                    {suggestion.reason}
                  </span>
                  {suggestion.accepted ? (
                    <>
                      <span className="ml-auto flex-none text-[13px] font-bold text-ink">
                        ✓ Left out (from a suggestion)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => props.onRestoreSuggestion(suggestion.index)}
                      >
                        Restore
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline-brand"
                      className="ml-auto flex-none"
                      onClick={() => props.onAcceptSuggestion(suggestion.index)}
                    >
                      Accept
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <CleanPrimer
          open={props.primerOpen}
          step={props.primerStep}
          onStepChange={props.onPrimerStepChange}
          onOpenChange={props.onPrimerOpenChange}
        />
      </>
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
