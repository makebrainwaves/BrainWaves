import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { railLabel } from '../Analyze/AnalyzeParts';

/** The cleaning loop of plan §8.2, one step at a time. */
export type PrimerStep = 1 | 2 | 3 | 4 | 5;

/** The §8.1 definition, shown with every step. */
export const CLEAN_DEFINITION =
  'Cleaning means finding trials or sensors with movement or poor signal and excluding them before the responses are averaged. Your original recording stays unchanged.';

/** The §8.2 loop in one line each, numbers written as text (global `li` reset). */
export const CLEAN_LOOP = [
  'Leave out noisy trials by clicking them.',
  'Flag a sensor that looks bad the whole way through.',
  'Check the auto-flag suggestions — they are only suggestions.',
  'Watch the Live ERP clean up as you go.',
  'Save the cleaned copy and continue to Analyze.',
];

const STEPS: PrimerStep[] = [1, 2, 3, 4, 5];

const PRIMER_COPY: Record<
  PrimerStep,
  { title: string; body: string; pointer: string }
> = {
  1: {
    title: 'Leave out noisy trials',
    body: 'Every column in the Epochs panel is one trial. Click a noisy one to leave it out — click it again to bring it back.',
    pointer: 'Click a noisy trial column to leave it out',
  },
  2: {
    title: 'Flag a bad sensor',
    body: 'One row is one sensor. If one sensor looks bad the whole way through, click its name to leave it out too.',
    pointer: 'Click a sensor name to flag it',
  },
  3: {
    title: 'Check the suggestions',
    body: 'Auto-flag can point out trials that look noisy. They collect under the Live ERP — they are only suggestions, so you decide.',
    pointer: 'Suggestions collect under the Live ERP',
  },
  4: {
    title: 'Watch the Live ERP',
    body: 'The Live ERP under these trials updates as you leave trials out. As the noisy trials go, the waves get cleaner.',
    pointer: 'This average updates as you clean',
  },
  5: {
    title: 'Save and continue',
    body: 'Save the cleaned dataset when you are happy. Analyze uses the cleaned copy to make your results; your original recording stays unchanged.',
    pointer: 'Save is in the left panel',
  },
};

/** Where each step points over the Epochs panel (`left`/`top` in % of it). */
const POINTER_PLACEMENT: Record<
  PrimerStep,
  { left: string; top: string; arrow: string }
> = {
  1: { left: '30%', top: '34%', arrow: '↓' },
  2: { left: '0%', top: '56%', arrow: '→' },
  3: { left: '58%', top: '90%', arrow: '↓' },
  4: { left: '18%', top: '90%', arrow: '↓' },
  5: { left: '0%', top: '30%', arrow: '←' },
};

/**
 * A callout chip over the Epochs panel showing which part of the screen the
 * current primer step is about; it may overlap the canvas edge but never
 * covers a pointer target or the Prev/Next controls. Decorative — the step
 * panel carries the words.
 */
export function PrimerPointer({ step }: { step: PrimerStep }) {
  const { left, top, arrow } = POINTER_PLACEMENT[step];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 flex max-w-[240px] items-center gap-[6px] rounded-md border-2 border-accent bg-white px-[10px] py-[6px] text-[13px] font-bold text-ink shadow-sm"
      style={{ left, top }}
    >
      {arrow === '←' && <span>{arrow}</span>}
      <span>{PRIMER_COPY[step].pointer}</span>
      {arrow !== '←' && <span>{arrow}</span>}
    </div>
  );
}

/**
 * The always-available cleaning primer, docked beside the Epochs panel so it
 * never covers the reviewer. Collapsed it teaches the whole loop (§8.1
 * definition plus the §8.2 steps); expanded it walks through the steps one at
 * a time in the walkthrough idiom from Analyze. No first-use flag.
 */
export function CleanPrimerPanel({
  open,
  step,
  onStepChange,
  onOpenChange,
  className,
}: {
  open: boolean;
  step: PrimerStep;
  onStepChange(step: PrimerStep): void;
  onOpenChange(open: boolean): void;
  className?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  return (
    <section
      aria-label="How cleaning works"
      className={cn(
        'flex flex-col gap-[8px] rounded-lg border border-gray-200 bg-white p-[16px]',
        className
      )}
    >
      {!open ? (
        <>
          <div className={railLabel}>How cleaning works</div>
          <div className="text-[13px] leading-[1.45] text-ink-muted">
            {CLEAN_DEFINITION}
          </div>
          <ol className="m-0 flex flex-col gap-[5px] p-0 text-[13px] leading-[1.4] text-ink">
            {CLEAN_LOOP.map((line, i) => (
              <li key={line}>
                <span className="font-bold text-ink-muted">{i + 1}.</span>{' '}
                {line}
              </li>
            ))}
          </ol>
          <Button
            variant="outline-brand"
            size="sm"
            className="mt-auto w-full"
            onClick={() => onOpenChange(true)}
          >
            Show steps
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-[10px]">
            <span className={railLabel} role="status">
              How cleaning works · Step {step} of 5
            </span>
            <span className="flex gap-[5px]" aria-hidden>
              {STEPS.map((s) => (
                <span
                  key={s}
                  className={cn(
                    'h-[6px] w-[18px] rounded-full',
                    s === step
                      ? 'bg-accent'
                      : s < step
                        ? 'bg-accent-light'
                        : 'bg-ink-faint'
                  )}
                />
              ))}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto flex-none text-ink-muted"
              onClick={() => onOpenChange(false)}
            >
              Hide ✕
            </Button>
          </div>
          <h2
            ref={heading}
            tabIndex={-1}
            className="m-0 text-[20px] font-light leading-tight text-ink outline-none"
          >
            {PRIMER_COPY[step].title}
          </h2>
          <div className="text-[14px] leading-[1.5] text-ink">
            {PRIMER_COPY[step].body}
          </div>
          <div className="text-[12px] leading-[1.45] text-ink-muted">
            {CLEAN_DEFINITION}
          </div>
          <div className="mt-auto flex justify-end gap-[8px]">
            <Button
              variant="outline-brand"
              size="sm"
              disabled={step === 1}
              onClick={() => onStepChange((step - 1) as PrimerStep)}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={() =>
                step === 5
                  ? onOpenChange(false)
                  : onStepChange((step + 1) as PrimerStep)
              }
            >
              {step === 5 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
