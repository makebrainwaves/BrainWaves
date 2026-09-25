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
    pointer: 'Suggested trials collect in the left panel',
  },
  4: {
    title: 'Watch the Live ERP',
    body: 'The Live ERP in the left panel updates as you leave trials out. As the noisy trials go, the waves get cleaner.',
    pointer: 'This average updates as you clean',
  },
  5: {
    title: 'Save and continue',
    body: 'Save the cleaned dataset when you are happy. Analyze uses the cleaned copy to make your results; your original recording stays unchanged.',
    pointer: 'Save is in the left panel',
  },
};

/** Where each step points over the review area (`left`/`top` in % of it). */
const POINTER_PLACEMENT: Record<
  PrimerStep,
  { left: string; top: string; arrow: string }
> = {
  1: { left: '26%', top: '38%', arrow: '↓' },
  2: { left: '1%', top: '52%', arrow: '→' },
  3: { left: '0%', top: '64%', arrow: '←' },
  4: { left: '0%', top: '30%', arrow: '←' },
  5: { left: '0%', top: '86%', arrow: '←' },
};

/**
 * A callout chip over the review area showing which part of the screen the
 * current primer step is about. Decorative — the step card carries the words.
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

/** The always-available collapsed primer: one line and a way back into the steps. */
export function CleanPrimerBar({
  onOpen,
  className,
}: {
  onOpen(): void;
  className?: string;
}) {
  return (
    <section
      aria-label="How cleaning works"
      className={cn(
        'flex items-center gap-[8px] rounded-md border border-gray-200 px-[10px] py-[2px]',
        className
      )}
    >
      <div className="min-w-0">
        <div className={railLabel}>How cleaning works</div>
        <div className="truncate text-[12px] text-ink-muted">
          Click a noisy trial to leave it out — click again to bring it back.
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto flex-none"
        onClick={onOpen}
      >
        Show steps
      </Button>
    </section>
  );
}

/**
 * The open primer: one step at a time in the walkthrough idiom from Analyze,
 * docked as a card near its pointer target over the review area (it covers no
 * control and no target). No first-use flag — it can always be reopened from
 * the rail bar.
 */
export function CleanPrimerCard({
  step,
  onStepChange,
  onClose,
  className,
}: {
  step: PrimerStep;
  onStepChange(step: PrimerStep): void;
  onClose(): void;
  className?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  const copy = PRIMER_COPY[step];
  return (
    <section
      aria-label="How cleaning works"
      className={cn(
        'flex w-[420px] flex-col gap-[6px] rounded-lg border border-gray-200 bg-white p-[16px] shadow-lg',
        className
      )}
    >
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
          onClick={onClose}
        >
          Hide ✕
        </Button>
      </div>
      <h2
        ref={heading}
        tabIndex={-1}
        className="m-0 text-[20px] font-light leading-tight text-ink outline-none"
      >
        {copy.title}
      </h2>
      <div className="text-[14px] leading-[1.5] text-ink">{copy.body}</div>
      <div className="text-[12px] leading-[1.45] text-ink-muted">
        {CLEAN_DEFINITION}
      </div>
      <div className="mt-[2px] flex justify-end gap-[8px]">
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
              ? onClose()
              : onStepChange((step + 1) as PrimerStep)
          }
        >
          {step === 5 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </section>
  );
}
