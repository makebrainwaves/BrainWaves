import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { RailSection, railLabel } from '../Analyze/AnalyzeParts';
import { CleanLayout, ConfirmDialog } from './CleanParts';
import { CLEAN_DEFINITION } from './CleanPrimer';
import type { RawRecording } from './fixtures';

export interface CleanDatasetSelectProps {
  recordings: RawRecording[];
  /** The one recording chosen for cleaning — Clean loads a single recording. */
  selected: string | null;
  onSelectChange(key: string): void;
  /** Ended-early recordings stay hidden until the student asks for them. */
  showIncomplete: boolean;
  onShowIncompleteChange(show: boolean): void;
  /** Ended-early recording pending a confirmed delete; null closes the dialog. */
  deletingRecording: RawRecording | null;
  onDeleteRequest(recording: RawRecording): void;
  onDeleteConfirm(): void;
  onDeleteCancel(): void;
  onStart(): void;
}

/** The §8.2 loop in one line each, numbers written as text (global `li` reset). */
const LOOP = [
  'Leave out noisy trials by clicking them.',
  'Flag a sensor that looks bad the whole way through.',
  'Check the auto-flag suggestions — they are only suggestions.',
  'Watch the Live ERP clean up as you go.',
  'Save the cleaned copy and continue to Analyze.',
];

/**
 * Clean's first phase: pick one complete raw recording to clean. Ended-early
 * recordings are hidden by default and, once revealed, are clearly incomplete
 * and deletable but never selectable as cleaning candidates. Pure props.
 */
export default function CleanDatasetSelect({
  recordings,
  selected,
  onSelectChange,
  showIncomplete,
  onShowIncompleteChange,
  deletingRecording,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onStart,
}: CleanDatasetSelectProps) {
  const complete = recordings.filter((r) => !r.incomplete);
  const incomplete = recordings.filter((r) => r.incomplete);
  const chosen = recordings.find((r) => r.key === selected) ?? null;

  const rail = (
    <>
      <RailSection label="What cleaning does">
        <div className="text-[13px] leading-[1.45] text-ink-muted">
          {CLEAN_DEFINITION}
        </div>
      </RailSection>
      <RailSection label="What you'll do" className="border-t border-gray-200 pt-[12px]">
        <ol className="m-0 flex flex-col gap-[4px] p-0 text-[13px] leading-[1.4] text-ink">
          {LOOP.map((line, i) => (
            <li key={line}>
              <span className="font-bold text-ink-muted">{i + 1}.</span> {line}
            </li>
          ))}
        </ol>
      </RailSection>
      <RailSection label="Your pick" className="border-t border-gray-200 pt-[12px]">
        <div className="text-[14px] text-ink">
          {chosen ? (
            <>
              <div className="font-bold">{chosen.subject}</div>
              <div className="truncate text-ink-muted">{chosen.name}</div>
            </>
          ) : (
            'Nothing chosen yet.'
          )}
        </div>
        <Button
          className="mt-[4px] w-full"
          size="lg"
          disabled={chosen === null}
          onClick={onStart}
        >
          Start cleaning
        </Button>
      </RailSection>
    </>
  );

  return (
    <CleanLayout title="Clean your data" rail={rail}>
      <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white p-[24px]">
        <h2 className="m-0 text-[22px] font-light text-ink">Clean your data</h2>
        <div className="mt-[4px] text-[15px] leading-[1.5] text-ink-muted">
          Choose a complete raw recording. Cleaning saves a new copy and never
          changes the original.
        </div>

        <div className={`${railLabel} mt-[16px]`}>Complete recordings</div>
        <ul
          role="radiogroup"
          aria-label="Complete recordings"
          className="m-0 mt-[6px] flex flex-col gap-[6px] p-0"
        >
          {complete.map((recording) => {
            const checked = selected === recording.key;
            return (
              <li key={recording.key}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-[12px] rounded-md border px-[14px] py-[10px]',
                    checked
                      ? 'border-brand bg-brand-light'
                      : 'border-gray-200 hover:border-brand'
                  )}
                >
                  <input
                    type="radio"
                    name="clean-recording"
                    className="h-[16px] w-[16px] accent-brand"
                    checked={checked}
                    onChange={() => onSelectChange(recording.key)}
                  />
                  <span className="font-bold text-ink">{recording.subject}</span>
                  <span className="text-[14px] text-ink">{recording.name}</span>
                  <span className="ml-auto text-[13px] text-ink-muted">
                    {recording.duration}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {incomplete.length > 0 && (
          <div className="mt-[12px] flex items-center gap-[8px] text-[13px] text-ink-muted">
            {incomplete.length} ended-early recording
            {incomplete.length === 1 ? '' : 's'}{' '}
            {showIncomplete ? 'shown below' : 'hidden'}
            <Button
              variant="link"
              size="sm"
              onClick={() => onShowIncompleteChange(!showIncomplete)}
            >
              {showIncomplete ? 'Hide' : 'Show'}
            </Button>
          </div>
        )}

        {showIncomplete && (
          <ul className="m-0 mt-[6px] flex flex-col gap-[6px] p-0">
            {incomplete.map((recording) => (
              <li
                key={recording.key}
                className="flex items-center gap-[12px] rounded-md border border-dashed border-gray-300 bg-gray-50 px-[14px] py-[10px]"
              >
                <span className="flex-none rounded-full border border-gray-300 px-[8px] py-[1px] text-[11px] font-bold uppercase tracking-[0.5px] text-ink-muted">
                  Ended early
                </span>
                <span className="text-[14px] text-ink-muted">
                  {recording.subject} · {recording.name}
                </span>
                <span className="text-[13px] text-ink-muted">
                  Kept as incomplete data — not a cleaning candidate.
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-auto flex-none"
                  onClick={() => onDeleteRequest(recording)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deletingRecording !== null}
        title="Delete this ended-early recording?"
        body={`${deletingRecording?.name ?? ''} will be deleted from your workspace. This can't be undone.`}
        confirmLabel="Delete recording"
        destructive
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </CleanLayout>
  );
}
