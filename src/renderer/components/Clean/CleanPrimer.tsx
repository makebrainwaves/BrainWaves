import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { railLabel } from '../Analyze/AnalyzeParts';

/** The cleaning loop of plan §8.2, one step at a time. */
export type PrimerStep = 1 | 2 | 3 | 4 | 5;

/** The §8.1 definition, shown with every step. */
export const CLEAN_DEFINITION =
  'Cleaning means finding trials or sensors with movement or poor signal and excluding them before the responses are averaged. Your original recording stays unchanged.';

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
    body: 'Auto-flag can point out trials that look noisy. They are only suggestions — you decide what to leave out.',
    pointer: 'Suggestions wait for your review',
  },
  4: {
    title: 'Watch the Live ERP',
    body: 'The average on the right updates as you leave trials out. As the noisy trials go, the waves get cleaner.',
    pointer: 'This average updates as you clean',
  },
  5: {
    title: 'Save and continue',
    body: 'Save the cleaned dataset when you are happy. Analyze uses the cleaned copy to make your results; your original recording stays unchanged.',
    pointer: 'Save is in the left panel',
  },
};

/** Where each step points over the review pair (`left`/`top` in % of the pair). */
const POINTER_PLACEMENT: Record<
  PrimerStep,
  { left: string; top: string; arrow: string }
> = {
  1: { left: '14%', top: '30%', arrow: '↓' },
  2: { left: '1%', top: '58%', arrow: '→' },
  3: { left: '0%', top: '4%', arrow: '←' },
  4: { left: '58%', top: '42%', arrow: '↓' },
  5: { left: '0%', top: '88%', arrow: '←' },
};

/**
 * A callout chip over the review pair showing which part of the screen the
 * current primer step is about. Decorative — the step copy carries the words.
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
 * The always-available cleaning primer: a compact step panel under the review
 * pair (the walkthrough idiom from Analyze), collapsed to a one-line bar once
 * the student starts working. No first-use flag — it can always be reopened.
 */
export function CleanPrimer({
  open,
  step,
  onStepChange,
  onOpenChange,
}: {
  open: boolean;
  step: PrimerStep;
  onStepChange(step: PrimerStep): void;
  onOpenChange(open: boolean): void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  if (!open) {
    return (
      <section
        aria-label="How cleaning works"
        className="flex h-[44px] flex-none items-center gap-[12px] rounded-lg border border-gray-200 bg-white px-[16px]"
      >
        <span className={railLabel}>How cleaning works</span>
        <div className="min-w-0 truncate text-[13px] text-ink-muted">
          Click a noisy trial to leave it out — click again to bring it back.
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto flex-none"
          onClick={() => onOpenChange(true)}
        >
          Show steps
        </Button>
      </section>
    );
  }

  const copy = PRIMER_COPY[step];
  return (
    <section
      aria-label="How cleaning works"
      className="flex h-[176px] flex-none gap-[24px] rounded-lg border border-gray-200 bg-white px-[20px] py-[14px]"
    >
      <div
        key={step}
        className="explore-step-copy flex min-w-0 flex-1 flex-col gap-[6px]"
      >
        <div className="flex items-center gap-[12px]">
          <span className={railLabel} role="status">
            How cleaning works · Step {step} of 5
          </span>
          <span className="flex gap-[6px]" aria-hidden>
            {STEPS.map((s) => (
              <span
                key={s}
                className={cn(
                  'h-[6px] w-[24px] rounded-full',
                  s === step
                    ? 'bg-accent'
                    : s < step
                      ? 'bg-accent-light'
                      : 'bg-ink-faint'
                )}
              />
            ))}
          </span>
        </div>
        <h2
          ref={heading}
          tabIndex={-1}
          className="m-0 text-[22px] font-light leading-tight text-ink outline-none"
        >
          {copy.title}
        </h2>
        <div className="max-w-[640px] text-[15px] leading-[1.5] text-ink">
          {copy.body}
        </div>
        <div className="max-w-[640px] text-[13px] leading-[1.45] text-ink-muted">
          {CLEAN_DEFINITION}
        </div>
      </div>
      <div className="flex flex-none flex-col items-end justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted"
          onClick={() => onOpenChange(false)}
        >
          Hide steps ✕
        </Button>
        <div className="flex gap-[8px]">
          <Button
            variant="outline-brand"
            size="lg"
            disabled={step === 1}
            onClick={() => onStepChange((step - 1) as PrimerStep)}
          >
            Back
          </Button>
          <Button
            size="lg"
            onClick={() =>
              step === 5
                ? onOpenChange(false)
                : onStepChange((step + 1) as PrimerStep)
            }
          >
            {step === 5 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </section>
  );
}
