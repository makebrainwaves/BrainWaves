import React, { useEffect, useRef } from 'react';
import type { EpochArraysMeta } from '../../actions';
import { EXPERIMENTS } from '../../constants/constants';
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
import ErpTraceChart, {
  CONDITION_DASH,
  ErpChartStep,
  trialsWithData,
} from './ErpTraceChart';
import type { EpochInfoRow } from '../../actions';

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
  /** Sensors flagged bad in every selected session: they have no ERP. */
  excludedChannels: string[];
  /** `pyodide.erpPlot` for `selectedChannel`. */
  erpPlot: { [key: string]: string } | null;
  /** `pyodide.epochsInfo`; condition rows feed the legend. */
  epochsInfo: EpochInfoRow[];
  /** Cleaned epochs as `get_epochs_arrays` ships them. Null hides the walkthrough. */
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  /** Marker registry `codeToLabel`, so the walkthrough says Face/House, not 1/2. */
  codeToLabel: Record<number, string>;
  /** Picks the walkthrough: Faces/Houses has its own, every other study a shorter one. */
  experimentType: EXPERIMENTS;
  walkthroughStep: ErpWalkthroughStep;
  /** `PredictionSummary` when this tab matches the student's prediction; shown first in the rail. */
  prediction?: React.ReactNode;
  onChannelSelect(channel: string): void;
  onWalkthroughStepChange(step: ErpWalkthroughStep): void;
  onRetry(): void;
  onGoToClean(): void;
}

interface WalkthroughContext {
  /** The sensor. */
  ch: string;
  /** Trials with data at `ch`. */
  n: number;
  /** Condition names, in legend order. */
  conditions: string[];
}

/** Experiment-specific words on the ERP tab. */
interface ErpCopy {
  /** Rail heading over the condition legend. */
  legendLabel: string;
  /** What appeared at time 0, as the chart labels it. */
  onset: string;
  /** Caption under the MNE ERP plot. */
  plotCaption: string;
  /** Body of the "pick a sensor" empty state. */
  pickSensor: string;
  /** Strip text before the walkthrough starts. */
  intro: (c: WalkthroughContext) => string;
  /** Walkthrough steps, in order; step `i + 1` draws chart step `i + 1`. */
  steps: { title: string; body: (c: WalkthroughContext) => string }[];
}

/**
 * Faces/Houses: the four-step walkthrough ending on the ~170 ms window the
 * chart highlights in step 4.
 */
const FACES_HOUSES: ErpCopy = {
  legendLabel: 'Image types',
  onset: 'image',
  plotCaption:
    'The average voltage after each image type. Shaded bands show how sure we can be about each line.',
  pickSensor:
    'Click a sensor on the head, or its name under it. Sensors near the ears (TP9, TP10) are closest to where the brain handles faces.',
  intro: ({ n }) =>
    `An ERP is the brain’s average response to one kind of event, like seeing a face. Four short steps show how this graph is made from your ${n} trials.`,
  steps: [
    {
      title: 'Every line is one trial',
      body: ({ ch }) =>
        `Each faint line is the voltage at ${ch} during one trial, from just before an image appeared until 0.8 seconds after. On its own, one trial is mostly noise: blinks, muscles and background rhythms.`,
    },
    {
      title: 'Average the trials together',
      body: ({ n }) =>
        `Noise goes up and down at random, so averaging ${n} trials mostly cancels it out. What is left happened at the same moment after every image: the brain’s response. That average is the ERP.`,
    },
    {
      title: 'Compare the two image types',
      body: () =>
        'Now there is one average for faces and one for houses. We zoomed in, so the scale is smaller. Where the lines pull apart, the brain responded differently to the two kinds of image.',
    },
    {
      title: 'Look around 170 ms',
      body: () =>
        'In many people the face average dips lower than the house average about 170 ms after the image. Your recording may show this clearly, weakly or not at all. Each of those is a real result.',
    },
  ],
};

/**
 * Every other study: three steps naming the study's own conditions, with no
 * claim about when a difference should appear.
 */
const ANY_STUDY: ErpCopy = {
  legendLabel: 'Conditions',
  onset: 'trial',
  plotCaption:
    'The average voltage after each kind of trial. Shaded bands show how sure we can be about each line.',
  pickSensor: 'Click a sensor on the head, or its name under it.',
  intro: ({ n }) =>
    `An ERP is the brain’s average response to one kind of trial. Three short steps show how this graph is made from your ${n} trials.`,
  steps: [
    {
      title: 'Every line is one trial',
      body: ({ ch }) =>
        `Each faint line is the voltage at ${ch} during one trial, from just before the trial appeared on screen until 0.8 seconds after. On its own, one trial is mostly noise: blinks, muscles and background rhythms.`,
    },
    {
      title: 'Average the trials together',
      body: ({ n }) =>
        `Noise goes up and down at random, so averaging ${n} trials mostly cancels it out. What is left happened at the same moment in every trial: the brain’s response. That average is the ERP.`,
    },
    {
      title: 'Compare the conditions',
      body: ({ conditions }) =>
        `Now each condition has its own average: ${new Intl.ListFormat('en').format(conditions.map((name) => `“${name}”`))}. We zoomed in, so the scale is smaller. Where the lines pull apart, the brain responded differently. A clear difference, a weak one or none: each is a real result.`,
    },
  ],
};

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
  copy,
  context,
  onStepChange,
}: {
  step: ErpWalkthroughStep;
  copy: ErpCopy;
  context: WalkthroughContext;
  onStepChange(step: ErpWalkthroughStep): void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  const last = copy.steps.length as ErpChartStep;
  const current = step === 0 ? null : copy.steps[step - 1];
  return (
    <section
      aria-label="Reading an ERP"
      className="flex h-[148px] flex-none gap-[24px] rounded-lg border border-gray-200 bg-white px-[20px] py-[14px]"
    >
      <div
        key={step}
        className="explore-step-copy flex min-w-0 flex-1 flex-col gap-[6px]"
      >
        <div className="flex items-center gap-[12px]">
          <span className={railLabel} role="status">
            Reading an ERP{step > 0 && ` · Step ${step} of ${last}`}
          </span>
          {step > 0 && (
            <span className="flex gap-[6px]" aria-hidden>
              {copy.steps.map(({ title }, i) => (
                <span
                  key={title}
                  className={cn(
                    'h-[6px] w-[24px] rounded-full',
                    i + 1 === step
                      ? 'bg-accent'
                      : i + 1 < step
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
          {current ? current.title : 'What am I looking at?'}
        </h2>
        <div className="max-w-[720px] text-[15px] leading-[1.5] text-ink">
          {current ? current.body(context) : copy.intro(context)}
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
                  onStepChange(step === last ? 0 : ((step + 1) as ErpChartStep))
                }
              >
                {step === last ? 'Finish' : 'Next'}
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
  excludedChannels,
  erpPlot,
  epochsInfo,
  epochArrays,
  codeToLabel,
  experimentType,
  walkthroughStep,
  prediction,
  onChannelSelect,
  onWalkthroughStepChange,
  onRetry,
  onGoToClean,
}: AnalyzeErpProps) {
  if (!eegAvailable) {
    return <CleanRequired analysis="ERP" onGoToClean={onGoToClean} />;
  }

  const conditions = epochsInfo.filter((row) => !EPOCH_TOTAL_ROWS[row.name]);
  const trialCount =
    epochArrays && selectedChannel
      ? trialsWithData(
          epochArrays,
          epochArrays.meta.ch_names.indexOf(selectedChannel)
        ).length
      : 0;
  const copy = experimentType === EXPERIMENTS.N170 ? FACES_HOUSES : ANY_STUDY;
  const context: WalkthroughContext = {
    ch: selectedChannel ?? '',
    n: trialCount,
    conditions: conditions.map((row) => row.name),
  };

  const rail = (
    <>
      {prediction}
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
          {channelInfo.map((channel) => {
            const excluded = excludedChannels.includes(channel);
            return (
              <button
                key={channel}
                type="button"
                aria-pressed={selectedChannel === channel}
                title={
                  excluded
                    ? 'Excluded: flagged bad in every selected session'
                    : undefined
                }
                onClick={() => onChannelSelect(channel)}
                className={cn(
                  'rounded-md border px-[8px] py-[6px] text-[14px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  selectedChannel === channel
                    ? 'border-brand bg-brand-light text-brand'
                    : 'border-gray-200 bg-white text-ink hover:border-brand',
                  excluded && 'text-ink-muted line-through'
                )}
              >
                {channel}
              </button>
            );
          })}
        </div>
      </RailSection>
      {conditions.length > 0 && (
        <RailSection
          label={copy.legendLabel}
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
  if (selectedChannel && excludedChannels.includes(selectedChannel)) {
    results = (
      <ResultStatus
        status="empty"
        title={`${selectedChannel} is excluded`}
        body={`${selectedChannel} was flagged bad in every selected session, so there is nothing to average. Pick another sensor, or add a recording where ${selectedChannel} was kept.`}
      />
    );
  } else if (status === 'loading') {
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
        body={copy.pickSensor}
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
                  : `${context.conditions.join(' vs ')} at ${selectedChannel}`}
              </h2>
            </figcaption>
            <ErpTraceChart
              epochArrays={epochArrays}
              channel={selectedChannel}
              codeToLabel={codeToLabel}
              step={walkthroughStep as ErpChartStep}
              onset={copy.onset}
            />
          </figure>
        ) : (
          <PlotFigure
            heading={`ERP at ${selectedChannel}`}
            caption={copy.plotCaption}
            workspaceTitle={workspaceTitle}
            imageTitle={`erp-${selectedChannel}`}
            plot={erpPlot}
          />
        )}
        {epochArrays && (
          <WalkthroughStrip
            step={walkthroughStep}
            copy={copy}
            context={context}
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
