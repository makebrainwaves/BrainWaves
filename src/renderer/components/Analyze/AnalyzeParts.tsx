import React, { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { cn } from '../ui/utils';
import PyodidePlotWidget from '../PyodidePlotWidget';
import { getSubjectNamesFromFiles } from '../../utils/filesystem/storage';
import type { DatasetOption } from './fixtures';

/** `get_epochs_info` rows that are totals, not conditions. */
export const EPOCH_TOTAL_ROWS: Record<string, true> = {
  'Drop Percentage': true,
  'Total Epochs': true,
};

/** Small uppercase label used for rail sections and step counters. */
export const railLabel =
  'text-[12px] font-bold uppercase tracking-[0.5px] text-ink-muted';

/**
 * Analyze tab body: a fixed-width controls rail on the left and the results
 * on the right, sized so both fit the window without page scroll.
 */
export function AnalyzeLayout({
  title,
  rail,
  children,
}: {
  /** Screen-reader heading for the tab (the tab bar already shows it). */
  title: string;
  rail: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 gap-[20px] px-[24px] py-[20px]">
      <h1 className="sr-only">{title}</h1>
      <aside
        aria-label="Analysis controls"
        className="flex w-[300px] flex-none flex-col gap-[12px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-[16px]"
      >
        {rail}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[14px]">
        {children}
      </div>
    </div>
  );
}

/** A titled group of controls inside the rail. */
export function RailSection({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-[6px]', className)}>
      <h2 className={cn('m-0', railLabel)}>{label}</h2>
      {children}
    </section>
  );
}

/**
 * Checkbox list of recordings, one row per file, led by the participant ID.
 * Replaces the native multi-select so choosing several needs no modifier key.
 */
export function DatasetChecklist({
  options,
  selected,
  onChange,
  inline = false,
}: {
  options: DatasetOption[];
  selected: string[];
  onChange(values: string[]): void;
  /** Horizontal chips for the plots-first strip. */
  inline?: boolean;
}) {
  const subjects = getSubjectNamesFromFiles(options.map((o) => o.value));
  return (
    <ul className={cn('m-0 flex gap-[4px] p-0', inline ? 'flex-row flex-wrap' : 'flex-col')}>
      {options.map((option, i) => {
        const checked = selected.includes(option.value);
        return (
          <li key={option.key}>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-[10px] rounded-md border px-[10px] py-[4px] text-[14px]',
                checked
                  ? 'border-brand bg-brand-light'
                  : 'border-gray-200 bg-white hover:border-brand'
              )}
            >
              <input
                type="checkbox"
                className="h-[16px] w-[16px] accent-brand"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? selected.filter((v) => v !== option.value)
                      : [...selected, option.value]
                  )
                }
              />
              <span className="font-bold text-ink">{subjects[i]}</span>
              {!inline && (
                <span className="min-w-0 truncate text-[12px] text-ink-muted">
                  {option.text}
                </span>
              )}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** Loading or failure in place of a result, keeping the rail usable. */
export function ResultStatus({
  status,
  title,
  body,
  onRetry,
}: {
  status: 'loading' | 'error' | 'empty';
  title: string;
  body: string;
  onRetry?(): void;
}) {
  return (
    <div
      role={status === 'error' ? 'alert' : 'status'}
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[12px] rounded-lg border border-gray-200 bg-white p-[32px] text-center"
    >
      {status === 'loading' && <Spinner size={36} aria-hidden />}
      {status === 'error' && (
        <span
          aria-hidden
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-red-50 text-[20px] font-bold text-red-700"
        >
          !
        </span>
      )}
      <h2 className="m-0 text-[24px] font-light text-ink">{title}</h2>
      <div className="max-w-[480px] text-[16px] leading-[1.5] text-ink-muted">
        {body}
      </div>
      {onRetry && (
        <Button size="lg" variant="outline-brand" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Per-section prerequisite: this EEG analysis needs cleaned data. Shown in
 * place of the section, never as a whole-Analyze gate, with one action.
 */
export function CleanRequired({
  analysis,
  onGoToClean,
}: {
  /** What is blocked, e.g. `Overview` or `ERP`. */
  analysis: string;
  onGoToClean(): void;
}) {
  return (
    <div className="px-[24px] py-[20px]">
      <div className="flex max-w-[760px] flex-col items-start gap-[12px] rounded-[6px] bg-[#ececf1] p-[40px]">
        <h1 className="m-0 !text-[28px] !font-light !leading-tight !tracking-[0.3px]">
          {analysis} needs cleaned EEG
        </h1>
        <div className="max-w-[560px] text-[17px] leading-[1.55] text-ink">
          Brain results are made from recordings with the noisy trials taken
          out. Clean at least one recording, then come back. Your behavior
          results are ready now in the Behavior tab.
        </div>
        <Button size="lg" className="mt-[8px]" onClick={onGoToClean}>
          Go to Clean
        </Button>
      </div>
    </div>
  );
}

/**
 * Two-to-three option picker. The chosen option is outlined in teal, not
 * filled, so the surface keeps a single filled primary action.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; text: string }[];
  value: T;
  onChange(value: T): void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-[4px]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-md border px-[8px] py-[6px] text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              active
                ? 'border-brand bg-brand-light text-brand'
                : 'border-gray-200 bg-white text-ink-muted hover:text-ink'
            )}
          >
            {option.text}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A Pyodide plot in a card that fills the space it is given: the image
 * scales down to fit (`.bw-analyze-plot`) instead of pushing the page taller.
 * Save as SVG/PNG comes from `PyodidePlotWidget`.
 */
export function PlotFigure({
  heading,
  caption,
  workspaceTitle,
  imageTitle,
  plot,
  aside,
}: {
  heading: ReactNode;
  /** One line on what the plot shows, in student terms. */
  caption: string;
  workspaceTitle: string;
  imageTitle: string;
  plot: { [key: string]: string };
  /** Right side of the heading row, e.g. a legend. */
  aside?: ReactNode;
}) {
  return (
    <figure className="m-0 flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white px-[16px] pb-[8px] pt-[12px]">
      <figcaption className="flex flex-none flex-col gap-[2px]">
        <div className="flex items-center justify-between gap-[12px]">
          <h2 className="m-0 text-[18px] font-normal text-ink">{heading}</h2>
          {aside}
        </div>
        <div className="text-[14px] leading-[1.4] text-ink-muted">
          {caption}
        </div>
      </figcaption>
      <div className="bw-analyze-plot">
        <PyodidePlotWidget
          title={workspaceTitle}
          imageTitle={imageTitle}
          plotMIMEBundle={plot}
        />
      </div>
    </figure>
  );
}
