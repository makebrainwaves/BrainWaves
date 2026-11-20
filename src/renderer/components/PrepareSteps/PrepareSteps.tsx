import React from 'react';
import PreviewLabel from '../PreviewLabel';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import type { FlowPhase } from './flow';
import type { Prediction } from '../../constants/interfaces';
import {
  isAnswerTo,
  type PredictionContent,
  type PredictionDirection,
  type PredictionOption,
} from '../../utils/prediction';

export type PrepareStepId = 'overview' | 'background' | 'protocol' | 'preview';

/** One stimulus → key pair, drawn in the Protocol response diagram. */
export interface ResponseMapping {
  key: string;
  /** What the participant is looking for, e.g. "Face" or "Red ink". Rule-dependent tasks fold the rule in, e.g. "Top: diamond". */
  label: string;
  /** An example stimulus: an image, or a word in colored ink (Stroop). */
  stimulus: { src: string; alt: string } | { word: string; color: string };
}

/** A named source; `name` gives the source and year, e.g. "Stroop (1935), Journal of Experimental Psychology". */
export interface SourceLink {
  name: string;
  address: string;
}

/** Background step content, rendered in field order; empty slots are skipped. */
export interface BackgroundContent {
  title: string;
  /** The mechanism. Paragraphs split on blank lines. */
  idea: string;
  /** One hedged finding with a named source. Paragraphs split on blank lines. */
  findings?: {
    /** Defaults to "What researchers have found". */
    title?: string;
    text: string;
    image?: string;
    imageAlt?: string;
  };
  /** One real discussion question. */
  discuss?: string;
  /** A fun fact, labelled "Aside" and shown below the core content. Carries its own caveat. */
  aside?: { text: string; image?: string };
  video?: { caption: string; embedUrl: string };
  links: SourceLink[];
}

/** Protocol "What we compare and measure" card. Conditions are the experiment's condition labels. */
export interface CompareContent {
  conditions: [string, string];
  /** Response time, accuracy, or the ERP, in student words. */
  measure: string;
  /** The Analyze tab (and setting) where the comparison appears. */
  whereInAnalyze: string;
}

export interface PrepareStepsProps {
  step: PrepareStepId;
  overview: {
    title: string;
    overview: string;
    links: { address: string; name: string }[];
  };
  background: BackgroundContent;
  protocol: { title: string; protocol: string; recording?: string };
  compare?: CompareContent;
  /** Protocol "Make a prediction" card: the question and its answers. */
  prediction?: PredictionContent;
  /** The workspace's saved prediction (`params.prediction`); shown as the picked answer when it answers `prediction`. */
  chosenPrediction?: Prediction;
  /** Saves a picked answer. Optional: nothing waits on it. */
  onPredictionChange?: (prediction: Prediction) => void;
  /** One or two lines for the teacher: screening, finger placement, eye guidance for EEG. */
  teacherNote?: string;
  responses: ResponseMapping[];
  flow: FlowPhase[];
  icon?: string;
  onStep: (step: PrepareStepId) => void;
  onCollect: () => void;
  onPreviewStart: () => void;
  onPreviewStop: () => void;
  onPreviewAgain: () => void;
  isPreviewing: boolean;
  hasPreviewed: boolean;
  /** Workspace EEG setting; with `onEEGEnabledChange`, the action row shows an "EEG recording" switch. */
  isEEGEnabled?: boolean;
  onEEGEnabledChange?: (enabled: boolean) => void;
  /** Offers "Customize": start a new Custom experiment (Design asks for its name). */
  onCustomize?: () => void;
  /** The live participant screen shown while previewing (Design passes `PreviewExperimentComponent`); a placeholder when absent. */
  preview?: React.ReactNode;
}

/** One built-in experiment's Prepare content, defined in its `experiments/<name>/prepare.ts`. */
export type PrepareFixture = Pick<
  PrepareStepsProps,
  | 'overview'
  | 'background'
  | 'protocol'
  | 'compare'
  | 'prediction'
  | 'teacherNote'
  | 'responses'
  | 'flow'
  | 'icon'
>;

/** The single centered reading column shared by the stepper, step content and action row. */
const COLUMN = 'mx-auto w-full max-w-[800px] px-6';

const EYEBROW = 'text-[13px] font-bold tracking-[0.5px] text-ink-muted';

/** Heading inside a Prepare card (definition, recording, video). */
const CARD_TITLE = 'm-0 text-[18px] font-bold tracking-normal text-ink';

const STEPS: { id: PrepareStepId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'background', label: 'Background' },
  { id: 'protocol', label: 'Protocol' },
  { id: 'preview', label: 'Preview' },
];

/** Keycap in the #273 participant-screen look (ink outline, heavy bottom edge), sized for lesson pages. */
const KEYCAP =
  'inline-flex h-[40px] min-w-[40px] flex-none items-center justify-center rounded-[8px] border-2 border-b-[5px] border-ink bg-white px-2 font-sans text-[20px] font-bold uppercase text-ink';

/**
 * Lesson progress inside Prepare. Pills in the secondary bar, so it never reads
 * as a second global nav: the global bar marks location with a 4px gold
 * underline, this marks the current step with a small gold-filled pill.
 */
function Stepper({
  current,
  onStep,
}: {
  current: PrepareStepId;
  onStep: (step: PrepareStepId) => void;
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Prepare steps" className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isCurrent = s.id === current;
        const isPast = i < currentIndex;
        return (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => onStep(s.id)}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex items-center gap-[6px] rounded-full py-[4px] pl-[5px] pr-[12px] text-[13px] font-bold tracking-[0.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                isCurrent
                  ? 'bg-accent text-ink'
                  : isPast
                    ? 'bg-brand-light text-brand hover:bg-brand hover:text-white'
                    : 'bg-white text-ink-muted hover:bg-[#f3f3f8] hover:text-ink'
              )}
            >
              <span
                className={cn(
                  'flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px]',
                  isCurrent
                    ? 'bg-white text-ink'
                    : isPast
                      ? 'bg-brand text-white'
                      : 'border border-ink-faint text-ink-muted'
                )}
              >
                {isPast ? '✓' : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`w-4 border-t-2 ${isPast ? 'border-brand' : 'border-ink-faint'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Static flowchart: each example stimulus, an arrow, then the key it asks for,
 * with "Sees" / "Presses" row labels. A figure, not a control, so it does not
 * invite a key press.
 */
function ResponseDiagram({ responses }: { responses: ResponseMapping[] }) {
  const rail = 'justify-self-start text-[14px] text-ink-muted';
  return (
    <figure className="m-0 flex flex-col gap-3 rounded-lg border border-[#ececf1] bg-white p-4">
      <figcaption className={EYEBROW}>HOW PARTICIPANTS RESPOND</figcaption>
      <ul className="m-0 grid auto-cols-fr grid-flow-col grid-cols-[auto] grid-rows-[repeat(4,auto)] items-center justify-items-center gap-x-3 gap-y-1 p-0">
        <li aria-hidden className="contents">
          <span className={rail}>Sees</span>
          <span />
          <span />
          <span className={rail}>Presses</span>
        </li>
        {responses.map(({ key, label, stimulus }) => (
          <li key={label} className="contents">
            {'src' in stimulus ? (
              <img
                src={stimulus.src}
                alt={stimulus.alt}
                className="h-[88px] w-[88px] rounded-md border border-[#ececf1] object-cover"
              />
            ) : (
              <span
                className="flex h-[72px] w-[88px] items-center justify-center rounded-md border border-[#ececf1] bg-white text-[20px] font-bold"
                style={{ color: stimulus.color }}
              >
                {stimulus.word}
              </span>
            )}
            <span className="text-[14px] font-bold text-ink">{label}</span>
            <svg
              aria-hidden
              width="12"
              height="22"
              viewBox="0 0 12 22"
              className="text-ink-muted"
            >
              <path
                d="M6 1v18M1.5 14.5 6 20l4.5-5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <kbd className={KEYCAP}>
              <span className="sr-only">press </span>
              {key}
            </kbd>
          </li>
        ))}
      </ul>
      <span className="mt-auto text-[14px] text-ink-muted">
        Just a diagram. You can try it for real in Preview.
      </span>
    </figure>
  );
}

/** Vertical timeline of the task's phases, generated from `flow`. */
function FlowTimeline({ phases }: { phases: FlowPhase[] }) {
  return (
    <section className="rounded-lg border border-[#e3def7] bg-[#f4f2ff] p-4">
      <h2 className={cn(EYEBROW, 'm-0 mb-3')}>WHAT HAPPENS IN THIS TASK</h2>
      <ol className="m-0 p-0">
        {phases.map((phase, i) => (
          <li
            key={phase.label}
            className="relative flex items-start gap-3 pb-3 last:pb-0"
          >
            {i < phases.length - 1 && (
              <span
                aria-hidden
                className="absolute bottom-[-6px] left-[5px] top-[18px] w-[2px] bg-[#c9c2ee]"
              />
            )}
            <span
              aria-hidden
              className={cn(
                'mt-[6px] h-[12px] w-[12px] flex-none rounded-full border-2',
                phase.count
                  ? 'border-brand bg-brand'
                  : 'border-ink-muted bg-white'
              )}
            />
            <span className="text-[16px] leading-[24px] text-ink">
              {phase.count ? (
                <>
                  <b>{phase.count}</b> {phase.label.toLowerCase()}
                </>
              ) : (
                phase.label
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Splits authored copy into paragraphs on blank lines. */
const paragraphs = (text: string) => text.split(/\n\s*\n/);

function OverviewView({
  overview,
  icon,
}: {
  overview: PrepareStepsProps['overview'];
  icon?: string;
}) {
  return (
    <section className="flex items-start gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <h1 className="m-0">{overview.title}</h1>
        {paragraphs(overview.overview).map((paragraph, i) => (
          <p
            key={paragraph}
            className={
              i === 0 ? 'experiment-design-lead' : 'experiment-design-copy'
            }
          >
            {paragraph}
          </p>
        ))}
      </div>
      {icon && (
        <img src={icon} alt="" className="mt-8 h-auto w-[180px] flex-none" />
      )}
    </section>
  );
}

function BackgroundView({
  background,
  icon,
}: {
  background: PrepareStepsProps['background'];
  icon?: string;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="m-0">{background.title}</h1>
      {paragraphs(background.idea).map((paragraph, i) => (
        <p
          key={paragraph}
          className={
            i === 0 ? 'experiment-design-lead' : 'experiment-design-copy'
          }
        >
          {paragraph}
        </p>
      ))}
      {background.findings && (
        <div className="flex items-start gap-4 rounded-lg border border-[#ececf1] bg-white p-5">
          {icon && (
            <div className="flex h-[56px] w-[56px] flex-none items-center justify-center rounded-lg border border-[#f6ead3] bg-[#fffaf0]">
              <img src={icon} alt="" className="max-w-9" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className={CARD_TITLE}>
              {background.findings.title ?? 'What researchers have found'}
            </h2>
            {paragraphs(background.findings.text).map((paragraph) => (
              <p key={paragraph} className="experiment-design-card-copy">
                {paragraph}
              </p>
            ))}
          </div>
          {background.findings.image && (
            <img
              src={background.findings.image}
              alt={background.findings.imageAlt ?? ''}
              className="w-[160px] flex-none rounded-md"
            />
          )}
        </div>
      )}
      {background.discuss && (
        <div className="flex flex-col gap-1 rounded-lg border border-[#e3def7] bg-[#f4f2ff] p-5">
          <h2 className={cn(EYEBROW, 'm-0')}>TALK ABOUT IT</h2>
          <p className="experiment-design-card-copy">{background.discuss}</p>
        </div>
      )}
      {background.aside && (
        <aside className="flex items-center gap-4 rounded-lg border border-accent-light bg-[#fff8e1] p-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className={cn(EYEBROW, 'm-0 text-[#7a5b00]')}>ASIDE</h2>
            <p className="experiment-design-card-copy">
              {background.aside.text}
            </p>
          </div>
          {background.aside.image && (
            <img
              src={background.aside.image}
              alt=""
              className="w-[60px] flex-none"
            />
          )}
        </aside>
      )}
      {background.video && <VideoEmbed video={background.video} />}
      {background.links.length > 0 && (
        <section className="flex flex-col items-start gap-1">
          <h2 className={cn(EYEBROW, 'm-0')}>SOURCES</h2>
          {background.links.map((link) => (
            <Button
              key={link.address}
              variant="link"
              className="h-auto whitespace-normal px-0 text-left text-[16px] font-bold underline"
              onClick={() => window.open(link.address, '_blank')}
            >
              {link.name} ↗
            </Button>
          ))}
        </section>
      )}
    </section>
  );
}

/** Embedded video on Background (Faces/Houses: Oliver Sacks on face blindness). */
function VideoEmbed({
  video,
}: {
  video: { caption: string; embedUrl: string };
}) {
  return (
    <section className="flex flex-col gap-3 pt-2">
      <h2 className={CARD_TITLE}>{video.caption}</h2>
      <div className="aspect-video w-full">
        <iframe
          src={video.embedUrl}
          title={video.caption}
          className="h-full w-full rounded-lg border border-[#ececf1]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

/** Protocol card naming the condition pair, the measure, and where it appears in Analyze. */
function CompareCard({ compare }: { compare: CompareContent }) {
  const rows = [
    ['COMPARE', compare.conditions.join(' vs ')],
    ['MEASURE', compare.measure],
    ['IN ANALYZE', compare.whereInAnalyze],
  ];
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-[#ececf1] bg-white p-5">
      <h2 className={CARD_TITLE}>What we compare and measure</h2>
      <dl className="m-0 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
        {rows.map(([term, value]) => (
          <div key={term} className="flex flex-col gap-1">
            <dt className={EYEBROW}>{term}</dt>
            <dd className="m-0 text-[16px] leading-[1.45] text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * A prediction question as a radio group: one bordered row per answer, the
 * picked one outlined in teal. Shared by the built-in Protocol card and
 * Custom's Overview card.
 */
export function PredictionChoices({
  question,
  options,
  selected,
  onSelect,
}: {
  question: string;
  options: PredictionOption[];
  selected?: PredictionDirection;
  onSelect: (direction: PredictionDirection) => void;
}) {
  const name = React.useId();
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-[16px] leading-[1.45] text-ink">
        {question}
      </legend>
      {options.map((option) => (
        <label
          key={option.direction}
          className="flex cursor-pointer items-center gap-3 rounded-md border border-[#ececf1] bg-white px-3 py-2 text-[15px] text-ink has-[:checked]:border-brand has-[:checked]:bg-brand-light has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand"
        >
          <input
            type="radio"
            name={name}
            value={option.direction}
            checked={selected === option.direction}
            onChange={() => onSelect(option.direction)}
            className="h-4 w-4 flex-none accent-brand"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

/** Protocol card: the student picks what they expect. Optional, and re-picking replaces the saved answer. */
function PredictionCard({
  prediction,
  chosen,
  onChange,
}: {
  prediction: PredictionContent;
  chosen?: Prediction;
  onChange?: (prediction: Prediction) => void;
}) {
  const selected = isAnswerTo(chosen, prediction) ? chosen.direction : undefined;
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-[#ececf1] bg-white p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className={CARD_TITLE}>Make a prediction</h2>
        <span className="text-[13px] text-ink-muted">
          Optional · you will check it in Analyze
        </span>
      </div>
      <PredictionChoices
        question={prediction.question}
        options={prediction.options}
        selected={selected}
        onSelect={(direction) =>
          onChange?.({
            conditions: prediction.conditions,
            measure: prediction.measure,
            direction,
          })
        }
      />
    </section>
  );
}

function ProtocolView({
  protocol,
  compare,
  prediction,
  chosenPrediction,
  onPredictionChange,
  teacherNote,
  responses,
  flow,
}: {
  protocol: PrepareStepsProps['protocol'];
  compare?: CompareContent;
  prediction?: PredictionContent;
  chosenPrediction?: Prediction;
  onPredictionChange?: (prediction: Prediction) => void;
  teacherNote?: string;
  responses: ResponseMapping[];
  flow: FlowPhase[];
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-4">
        <h1 className="m-0">{protocol.title}</h1>
        <p className="experiment-design-copy">{protocol.protocol}</p>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-4">
        <ResponseDiagram responses={responses} />
        <FlowTimeline phases={flow} />
      </div>
      {compare && <CompareCard compare={compare} />}
      {prediction && (
        <PredictionCard
          prediction={prediction}
          chosen={chosenPrediction}
          onChange={onPredictionChange}
        />
      )}
      {protocol.recording && (
        <div className="flex flex-col gap-1 rounded-lg border border-[#ececf1] bg-white p-5">
          <h2 className={CARD_TITLE}>What we&apos;re recording: EEG</h2>
          <p className="experiment-design-card-copy">{protocol.recording}</p>
        </div>
      )}
      {teacherNote && (
        <div className="flex flex-col gap-1 rounded-lg border border-dashed border-[#c9c2ee] p-4">
          <h2 className={cn(EYEBROW, 'm-0')}>TEACHER NOTE</h2>
          <p className="experiment-design-card-copy">{teacherNote}</p>
        </div>
      )}
    </section>
  );
}

/** Preview-step copy before and after a preview run. */
const PREVIEW_INTRO = {
  stopped: {
    title: 'See it the way they will',
    body: 'Nothing is recorded during a preview. Try the experiment, then decide when you are ready to collect real data.',
  },
  finished: {
    title: 'Ready to record?',
    body: 'Preview is done. When a participant is ready, run and record real data.',
  },
};

/**
 * The running preview fills the free height (at least 420px) and draws the
 * participant screen at 0.55 zoom, so a screen laid out for a ~1366px-wide run
 * area shows whole, without scrolling, in the 800px lesson column.
 */
function PreviewRunningView({ preview }: { preview?: React.ReactNode }) {
  return (
    <section className="flex flex-1 flex-col">
      <div className="flex min-h-[420px] flex-1 flex-col gap-3 rounded-lg border-2 border-dashed border-[#d4d4de] bg-white p-4">
        <span className={EYEBROW}>EXPERIMENT AREA</span>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-[#f9f9f9]">
          {preview ? (
            <div className="absolute inset-0 flex [zoom:0.55]">{preview}</div>
          ) : (
            <span className="absolute inset-0 m-auto h-fit w-fit text-[15px] text-ink-muted">
              Participant screen would appear here
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function StepActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-[#e5e5e5] bg-white/95 backdrop-blur-sm">
      <div className={cn(COLUMN, 'flex flex-wrap items-center gap-3 py-2')}>
        {children}
      </div>
    </div>
  );
}

function ActionNext({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button size="lg" onClick={onClick}>
      {children}
    </Button>
  );
}

function ActionBack({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button size="lg" variant="outline" onClick={onClick}>
      {children}
    </Button>
  );
}

/** The workspace's EEG recording switch: a native checkbox named "EEG recording", drawn as a toggle. */
function EEGSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'flex h-[22px] w-10 flex-none items-center rounded-full px-[3px]',
          checked ? 'justify-end bg-brand' : 'justify-start bg-ink-faint'
        )}
      >
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
      <span className="text-[14px] text-ink">EEG recording</span>
    </label>
  );
}

/** Built-in lesson steps of the Prepare area: Overview, Background, Protocol, Preview. Pure props. */
export default function PrepareSteps(props: PrepareStepsProps) {
  const { step, onStep, isPreviewing, hasPreviewed } = props;
  const previewStopped = step === 'preview' && !isPreviewing && !hasPreviewed;
  const previewRunning = step === 'preview' && isPreviewing;
  const previewFinished = step === 'preview' && !isPreviewing && hasPreviewed;
  const previewIntro = previewStopped
    ? PREVIEW_INTRO.stopped
    : previewFinished
      ? PREVIEW_INTRO.finished
      : undefined;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="border-b border-[#e5e5e5] bg-white py-3">
        <div className={COLUMN}>
          <Stepper current={step} onStep={onStep} />
        </div>
      </div>
      <main className="experiment-design-content min-h-0 flex-1 overflow-y-auto bg-app">
        <div className="flex min-h-full flex-col">
          <div
            className={cn(
              COLUMN,
              'flex flex-1 flex-col pb-5',
              previewRunning ? 'pt-5' : 'pt-10'
            )}
          >
            {!previewRunning && (
              <span className={cn(EYEBROW, 'mb-2 uppercase tracking-[1px]')}>
                Step {stepIndex + 1} of {STEPS.length} ·{' '}
                {STEPS[stepIndex].label}
              </span>
            )}
            {step === 'overview' && (
              <OverviewView overview={props.overview} icon={props.icon} />
            )}
            {step === 'background' && (
              <BackgroundView background={props.background} icon={props.icon} />
            )}
            {step === 'protocol' && (
              <ProtocolView
                protocol={props.protocol}
                compare={props.compare}
                prediction={props.prediction}
                chosenPrediction={props.chosenPrediction}
                onPredictionChange={props.onPredictionChange}
                teacherNote={props.teacherNote}
                responses={props.responses}
                flow={props.flow}
              />
            )}
            {previewIntro && (
              <header className="flex flex-col gap-4">
                <h1 className="m-0">{previewIntro.title}</h1>
                <p className="experiment-design-copy">{previewIntro.body}</p>
              </header>
            )}
            {previewRunning && <PreviewRunningView preview={props.preview} />}
          </div>
          <StepActions>
            {step === 'overview' && (
              <ActionNext onClick={() => onStep('background')}>
                Next: Background →
              </ActionNext>
            )}
            {step === 'background' && (
              <>
                <ActionBack onClick={() => onStep('overview')}>
                  ← Back
                </ActionBack>
                <ActionNext onClick={() => onStep('protocol')}>
                  Next: Protocol →
                </ActionNext>
              </>
            )}
            {step === 'protocol' && (
              <>
                <ActionBack onClick={() => onStep('background')}>
                  ← Back
                </ActionBack>
                <ActionNext onClick={() => onStep('preview')}>
                  Try the experiment →
                </ActionNext>
              </>
            )}
            {previewStopped && (
              <>
                <ActionBack onClick={() => onStep('protocol')}>
                  ← Back
                </ActionBack>
                <ActionNext onClick={props.onPreviewStart}>
                  Try the experiment →
                </ActionNext>
              </>
            )}
            {previewRunning && (
              <>
                <ActionBack onClick={props.onPreviewStop}>
                  Stop preview
                </ActionBack>
                <PreviewLabel />
              </>
            )}
            {previewFinished && (
              <>
                <ActionBack onClick={props.onPreviewAgain}>
                  Preview again
                </ActionBack>
                <ActionNext onClick={props.onCollect}>
                  Run &amp; record →
                </ActionNext>
              </>
            )}
            {(props.onEEGEnabledChange || props.onCustomize) && (
              <div className="ml-auto flex items-center gap-2">
                {props.onEEGEnabledChange && (
                  <EEGSwitch
                    checked={Boolean(props.isEEGEnabled)}
                    onChange={props.onEEGEnabledChange}
                  />
                )}
                {props.onCustomize && (
                  <Button variant="link" onClick={props.onCustomize}>
                    Customize
                  </Button>
                )}
              </div>
            )}
          </StepActions>
        </div>
      </main>
    </div>
  );
}
