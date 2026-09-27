import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Spinner } from '../ui/spinner';
import type {
  FeasibilityAssessment,
  Verdict,
} from '../../utils/feasibility/rules';
import { useFeasibility } from '../../utils/feasibility/useFeasibility';

type Band = 'green' | 'yellow' | 'red';

/** Every verdict lands in one of three traffic-light bands. */
const VERDICT_BAND: Record<Verdict, Band> = {
  feasible: 'green',
  stretch: 'yellow',
  unclear: 'yellow',
  'not-feasible': 'red',
};

const BANDS: Record<
  Band,
  {
    label: string;
    chip: string;
    dot: string;
    border: string;
    continueLabel: string;
  }
> = {
  green: {
    label: 'Great experiment idea',
    chip: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-t-emerald-500',
    continueLabel: 'Continue to stimuli →',
  },
  yellow: {
    label: 'Oh, this could get complicated',
    chip: 'bg-amber-100 text-amber-900 ring-amber-300',
    dot: 'bg-amber-400',
    border: 'border-t-amber-400',
    continueLabel: 'Continue anyway →',
  },
  red: {
    label: "This probably won't work",
    chip: 'bg-rose-100 text-rose-900 ring-rose-300',
    dot: 'bg-rose-500',
    border: 'border-t-rose-500',
    continueLabel: 'Continue anyway →',
  },
};

/**
 * Compact verdict of the last feasibility analysis. Callers show it only while
 * that analysis still matches the design.
 */
export function FeasibilityChip({ verdict }: { verdict: Verdict }) {
  const band = BANDS[VERDICT_BAND[verdict]];
  return (
    <span
      title="Feasibility analysis of your current design"
      className={`inline-flex h-[26px] shrink-0 items-center gap-[6px] whitespace-nowrap rounded-full px-[10px] text-[12px] font-bold ring-1 ${band.chip}`}
    >
      <span
        aria-hidden
        className={`h-[8px] w-[8px] rounded-full ${band.dot}`}
      />
      {band.label}
    </span>
  );
}

interface FeasibilityDialogProps {
  open: boolean;
  assessment: FeasibilityAssessment;
  /** The LLM phrasing request for `assessment` (see `phrasingPrompt`). */
  prompt: string;
  /** Close and go back to editing the design. */
  onRevise: () => void;
  /** The student has read the analysis and moves on to gathering stimuli. */
  onContinue: () => void;
}

/**
 * The checkpoint between designing an experiment and gathering its stimuli.
 * Blocking: it can only be left through its buttons, and those unlock once
 * the local model has finished writing (or failed, which falls back to the
 * rules' own words). `assessFeasibility` makes the call; the model phrases it.
 */
export default function FeasibilityDialog({
  open,
  ...props
}: FeasibilityDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className={`max-w-[520px] border-t-[6px] p-0 ${
          BANDS[VERDICT_BAND[props.assessment.verdict]].border
        }`}
      >
        <FeasibilityReport {...props} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Mounted only while the dialog is open, so each opening sends one request
 * and closing aborts it. Uses divs, not p/h*: the global `p`/`h2` rules are
 * `!important`.
 */
function FeasibilityReport({
  assessment,
  prompt,
  onRevise,
  onContinue,
}: Omit<FeasibilityDialogProps, 'open'>) {
  const { status, text } = useFeasibility(prompt);
  const isDone = status === 'done' || status === 'error';
  const band = BANDS[VERDICT_BAND[assessment.verdict]];

  return (
    <div className="flex max-h-[80vh] flex-col">
      <div className="px-[24px] pt-[20px]">
        <DialogTitle className="text-[22px] font-bold text-brand">
          Feasibility Analysis
        </DialogTitle>
        <div className="text-[14px] text-gray-500">
          Will this experiment work?
        </div>
      </div>
      <div
        aria-live="polite"
        className="overflow-y-auto px-[24px] py-[14px] text-[15px] leading-snug text-gray-800"
      >
        <div
          className={`mb-[10px] flex items-center gap-[8px] rounded-full px-[14px] py-[6px] text-[15px] font-semibold ring-1 ${band.chip}`}
        >
          <span
            aria-hidden
            className={`h-[10px] w-[10px] shrink-0 rounded-full ${band.dot}`}
          />
          {band.label}
        </div>
        {assessment.target && (
          <div className="-mt-[4px] mb-[10px] text-[13px] text-gray-500">
            Measuring: {assessment.target}
          </div>
        )}
        {status === 'error' ? (
          <div>
            {assessment.reason} {assessment.suggestion} It&apos;s your
            experiment, so you can still run it as planned.
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{text.trim()}</div>
        )}
        {!isDone && (
          <div className="my-[8px] flex items-center gap-2 text-[14px] text-gray-500">
            <Spinner size={16} />
            {status === 'loading'
              ? 'Waking up the AI…'
              : 'The AI is reading your design…'}
          </div>
        )}
        {assessment.pitfalls.length > 0 && (
          <div className="mt-[14px]">
            <div className="text-[14px] font-bold text-gray-900">
              Things to watch
            </div>
            {assessment.pitfalls.map((pitfall) => (
              <div
                key={pitfall}
                className="my-[3px] pl-[14px] -indent-[10px] text-[14px]"
              >
                • {pitfall}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-[10px] border-t border-gray-100 px-[24px] py-[14px]">
        <Button variant="secondary" disabled={!isDone} onClick={onRevise}>
          Revise my design
        </Button>
        <Button disabled={!isDone} onClick={onContinue}>
          {band.continueLabel}
        </Button>
      </div>
      <div className="px-[24px] pb-[14px] text-[12px] text-gray-400">
        This analysis is provided by a local AI model. It&apos;s just a
        suggestion — it&apos;s your experiment, and you decide what to do.
      </div>
    </div>
  );
}
