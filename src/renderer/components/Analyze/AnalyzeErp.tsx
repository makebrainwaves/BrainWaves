import React, { useEffect, useRef } from 'react';
import type { EpochArraysMeta } from '../../actions';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import ClickableHeadDiagramSVG from '../svgs/ClickableHeadDiagramSVG';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  AnalyzeLayout,
  EPOCH_TOTAL_ROWS,
  CleanRequired,
  PlotFigure,
  RailSection,
  ResultStatus,
  railLabel,
} from './AnalyzeParts';
import ErpTraceChart, { CONDITION_DASH, ErpChartStep } from './ErpTraceChart';
import type { EpochInfoRow } from './fixtures';

/** 0 shows the MNE ERP plot; 1–4 are walkthrough steps drawn from the epoch arrays. */
export type ErpWalkthroughStep = 0 | ErpChartStep;

export interface AnalyzeErpProps {
  /** `empty` until a sensor has been picked and its ERP requested. */
  status: 'results' | 'loading' | 'error' | 'empty';
  /** False until the workspace has at least one cleaned recording. */
  eegAvailable: boolean;
  workspaceTitle: string;
  /** `pyodide.channelInfo`. */
  channelInfo: string[];
  selectedChannel: string | null;
  /** `pyodide.erpPlot` for `selectedChannel`. */
  erpPlot: { [key: string]: string } | null;
  /** `pyodide.epochsInfo`; condition rows feed the legend. */
  epochsInfo: EpochInfoRow[];
  /** Cleaned epochs as `get_epochs_arrays` ships them. Null hides the walkthrough. */
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  /** Marker registry `codeToLabel`, so the walkthrough says Face/House, not 1/2. */
  codeToLabel: Record<number, string>;
  walkthroughStep: ErpWalkthroughStep;
  onChannelSelect(channel: string): void;
  onWalkthroughStepChange(step: ErpWalkthroughStep): void;
  onRetry(): void;
  onGoToClean(): void;
}

/** Walkthrough copy. `n` is the trial count, `ch` the sensor. */
const WALKTHROUGH: Record<
  ErpChartStep,
  { title: string; body: (ch: string, n: number) => string }
> = {
  1: {
    title: 'Every line is one trial',
    body: (ch) =>
      `Each faint line is the voltage at ${ch} during one trial, from just before an image appeared until 0.8 seconds after. On its own, one trial is mostly noise: blinks, muscles and background rhythms.`,
  },
  2: {
    title: 'Average the trials together',
    body: (_, n) =>
      `Noise goes up and down at random, so averaging ${n} trials mostly cancels it out. What is left happened at the same moment after every image: the brain’s response. That average is the ERP.`,
  },
  3: {
    title: 'Compare the two image types',
    body: () =>
      'Now there is one average for faces and one for houses. We zoomed in, so the scale is smaller. Where the lines pull apart, the brain responded differently to the two kinds of image.',
  },
  4: {
    title: 'Look around 170 ms',
    body: () =>
      'In many people the face average dips lower than the house average about 170 ms after the image. Your recording may show this clearly, weakly or not at all. Each of those is a real result.',
  },
};

const STEPS: ErpChartStep[] = [1, 2, 3, 4];

/** Solid/dashed swatch matching the chart and legend line styles. */
function LineSwatch({ index }: { index: number }) {
  return (
    <svg width="26" height="10" aria-hidden className="flex-none">
      <line
        x1="1"
        x2="25"
        y1="5"
        y2="5"
        stroke={cssColorForIndex(index)}
        strokeWidth="3"
        strokeDasharray={CONDITION_DASH[index % CONDITION_DASH.length]}
      />
    </svg>
  );
}

/**
 * The strip under the graph: an invitation to the walkthrough (step 0) or the
 * current step with Back / Next / Exit, one step at a time like Explore's
 * lesson flow.
 */
function WalkthroughStrip({
  step,
  channel,
  trialCount,
  onStepChange,
}: {
  step: ErpWalkthroughStep;
  channel: string;
  trialCount: number;
  onStepChange(step: ErpWalkthroughStep): void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  const copy = step === 0 ? null : WALKTHROUGH[step];
  return (
    <section
      aria-label="Reading an ERP"
      className="flex h-[148px] flex-none gap-[24px] rounded-lg border border-gray-200 bg-white px-[20px] py-[14px]"
    >
      <div key={step} className="explore-step-copy flex min-w-0 flex-1 flex-col gap-[6px]">
        <div className="flex items-center gap-[12px]">
          <span className={railLabel} role="status">
            Reading an ERP{step > 0 && ` · Step ${step} of 4`}
          </span>
          {step > 0 && (
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
          )}
        </div>
        <h2
          ref={heading}
          tabIndex={-1}
          className="m-0 text-[22px] font-light leading-tight text-ink outline-none"
        >
          {copy ? copy.title : 'What am I looking at?'}
        </h2>
        <div className="max-w-[720px] text-[15px] leading-[1.5] text-ink">
          {copy
            ? copy.body(channel, trialCount)
            : `An ERP is the brain’s average response to one kind of event, like seeing a face. Four short steps show how this graph is made from your ${trialCount} trials.`}
        </div>
      </div>
      <div className="flex flex-none flex-col items-end justify-between">
        {step > 0 ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-ink-muted"
              onClick={() => onStepChange(0)}
            >
              Exit walkthrough ✕
            </Button>
            <div className="flex gap-[8px]">
              <Button
                variant="outline-brand"
                size="lg"
                onClick={() => onStepChange((step - 1) as ErpWalkthroughStep)}
              >
                Back
              </Button>
              <Button
                size="lg"
                onClick={() =>
                  onStepChange(step === 4 ? 0 : ((step + 1) as ErpChartStep))
                }
              >
                {step === 4 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </>
        ) : (
          <Button size="lg" className="mt-auto" onClick={() => onStepChange(1)}>
            Walk me through it
          </Button>
        )}
      </div>
    </section>
  );
}

/**
 * ERP tab, graph first: pick a sensor on the head or in the list, read its
 * ERP, and optionally step through how an ERP is built from single trials.
 * Pure props.
 */
export default function AnalyzeErp({
  status,
  eegAvailable,
  workspaceTitle,
  channelInfo,
  selectedChannel,
  erpPlot,
  epochsInfo,
  epochArrays,
  codeToLabel,
  walkthroughStep,
  onChannelSelect,
  onWalkthroughStepChange,
  onRetry,
  onGoToClean,
}: AnalyzeErpProps) {
  if (!eegAvailable) {
    return <CleanRequired analysis="ERP" onGoToClean={onGoToClean} />;
  }

  const conditions = epochsInfo.filter((row) => !EPOCH_TOTAL_ROWS[row.name]);
  const trialCount = epochArrays?.meta.n_epochs ?? 0;

  const rail = (
    <>
      <RailSection label="Sensor">
        <div className="flex justify-center">
          <div className="w-[250px]">
            <ClickableHeadDiagramSVG
              channelinfo={channelInfo}
              onChannelClick={onChannelSelect}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[6px]">
          {channelInfo.map((channel) => (
            <button
              key={channel}
              type="button"
              aria-pressed={selectedChannel === channel}
              onClick={() => onChannelSelect(channel)}
              className={cn(
                'rounded-md border px-[8px] py-[6px] text-[14px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                selectedChannel === channel
                  ? 'border-brand bg-brand-light text-brand'
                  : 'border-gray-200 bg-white text-ink hover:border-brand'
              )}
            >
              {channel}
            </button>
          ))}
        </div>
      </RailSection>
      {conditions.length > 0 && (
        <RailSection
          label="Image types"
          className="border-t border-gray-200 pt-[12px]"
        >
          <ul className="m-0 flex flex-col gap-[6px] p-0 text-[14px] text-ink">
            {conditions.map((row, i) => (
              <li key={row.name} className="flex items-center gap-[10px]">
                <LineSwatch index={i} />
                <span className="font-bold">{row.name}</span>
                <span className="ml-auto text-ink-muted">
                  {row.value} trials
                </span>
              </li>
            ))}
          </ul>
        </RailSection>
      )}
    </>
  );

  let results: React.ReactNode;
  if (status === 'loading') {
    results = (
      <ResultStatus
        status="loading"
        title={`Building the ERP for ${selectedChannel}…`}
        body="Averaging every trial and working out how sure we can be about each point. This can take a few seconds."
      />
    );
  } else if (status === 'error') {
    results = (
      <ResultStatus
        status="error"
        title="The ERP didn’t load"
        body="Something went wrong while averaging this sensor. Try again, or pick a different sensor."
        onRetry={onRetry}
      />
    );
  } else if (status === 'empty' || !selectedChannel || !erpPlot) {
    results = (
      <ResultStatus
        status="empty"
        title="Pick a sensor to see its ERP"
        body="Click a sensor on the head, or its name under it. Sensors near the ears (TP9, TP10) are closest to where the brain handles faces."
      />
    );
  } else {
    results = (
      <>
        {epochArrays && walkthroughStep > 0 ? (
          <figure className="m-0 flex min-h-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white px-[16px] pb-[8px] pt-[12px]">
            <figcaption className="flex-none">
              <h2 className="m-0 text-[18px] font-normal text-ink">
                {walkthroughStep <= 2
                  ? `Your ${trialCount} trials at ${selectedChannel}`
                  : `Face vs House at ${selectedChannel}`}
              </h2>
            </figcaption>
            <ErpTraceChart
              epochArrays={epochArrays}
              channel={selectedChannel}
              codeToLabel={codeToLabel}
              step={walkthroughStep as ErpChartStep}
            />
          </figure>
        ) : (
          <PlotFigure
            heading={`ERP at ${selectedChannel}`}
            caption="The average voltage after each image type. Shaded bands show how sure we can be about each line."
            workspaceTitle={workspaceTitle}
            imageTitle={`erp-${selectedChannel}`}
            plot={erpPlot}
          />
        )}
        {epochArrays && (
          <WalkthroughStrip
            step={walkthroughStep}
            channel={selectedChannel}
            trialCount={trialCount}
            onStepChange={onWalkthroughStepChange}
          />
        )}
      </>
    );
  }

  return (
    <AnalyzeLayout title="ERP" rail={rail}>
      {results}
    </AnalyzeLayout>
  );
}
