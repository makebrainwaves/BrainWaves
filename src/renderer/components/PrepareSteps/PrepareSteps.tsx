import React from 'react';
import PreviewLabel from '../PreviewLabel';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import type { FlowPhase } from './flow';

export type PrepareStepId = 'overview' | 'background' | 'protocol' | 'preview';

/** One stimulus → key pair, drawn in the Protocol diagram and the Preview key legend. */
export interface ResponseMapping {
  key: string;
  /** What the participant is looking for, e.g. "Face" or "Red ink". Rule-dependent tasks fold the rule in, e.g. "Top: diamond". */
  label: string;
  /** An example stimulus: an image, or a word in colored ink (Stroop). */
  stimulus: { src: string; alt: string } | { word: string; color: string };
}

export interface PrepareStepsProps {
  step: PrepareStepId;
  overview: {
    title: string;
    overview: string;
    links: { address: string; name: string }[];
  };
  background: {
    links: { address: string; name: string }[];
    title?: string;
    definition_title?: string;
    link_meta?: string;
    fun_fact_image?: string;
    first_column_statement: string;
    first_column_question: string;
    second_column_statement: string;
    second_column_question: string;
  };
  protocol: { title: string; protocol: string };
  responses: ResponseMapping[];
  flow: FlowPhase[];
  icon?: string;
  /** Local stand-in for the Oliver Sacks clip (§6.3: no remote player, rights unconfirmed); replaces Background's video link. */
  mediaFallback?: { caption: string; alt: string };
  onStep: (step: PrepareStepId) => void;
  onCollect: () => void;
  onPreviewStart: () => void;
  onPreviewStop: () => void;
  onPreviewAgain: () => void;
  isPreviewing: boolean;
  hasPreviewed: boolean;
  /** The live participant screen shown while previewing (Design passes `PreviewExperimentComponent`); a placeholder when absent. */
  preview?: React.ReactNode;
}

/** One built-in experiment's Prepare content, defined in its `experiments/<name>/prepare.ts`. */
export type PrepareFixture = Pick<
  PrepareStepsProps,
  'overview' | 'background' | 'protocol' | 'responses' | 'flow' | 'icon'
>;

/** The single centered reading column shared by the stepper, step content and action row. */
const COLUMN = 'mx-auto w-full max-w-[800px] px-6';

const EYEBROW = 'text-[13px] font-bold tracking-[0.5px] text-ink-muted';

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
  const steps: { id: PrepareStepId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'background', label: 'Background' },
    { id: 'protocol', label: 'Protocol' },
    { id: 'preview', label: 'Preview' },
  ];
  const currentIndex = steps.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Prepare steps" className="flex items-center gap-2">
      {steps.map((s, i) => {
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
            {i < steps.length - 1 && (
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

function KeyLegend({ responses }: { responses: ResponseMapping[] }) {
  return (
    <ul className="m-0 flex flex-wrap items-center gap-x-5 gap-y-2 p-0">
      {responses.map(({ label, key }) => (
        <li key={label} className="flex items-center gap-2">
          <kbd className={KEYCAP}>{key}</kbd>
          <span className="text-[16px] text-ink">{label}</span>
        </li>
      ))}
    </ul>
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

function OverviewView({
  overview,
  icon,
}: {
  overview: PrepareStepsProps['overview'];
  icon?: string;
}) {
  return (
    <section className="flex items-start gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className={EYEBROW}>THE BIG QUESTION</span>
        <h1 className="m-0 [text-wrap:pretty]">{overview.title}</h1>
        {overview.overview.split(/\n\s*\n/).map((paragraph) => (
          <p key={paragraph} className="experiment-design-copy m-0">
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
  media,
}: {
  background: PrepareStepsProps['background'];
  icon?: string;
  media?: PrepareStepsProps['mediaFallback'];
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className={EYEBROW}>BACKGROUND · 2 MIN READ</span>
        <h1 className="m-0 [text-wrap:pretty]">
          {background.title ?? 'Background'}
        </h1>
      </header>
      <p className="experiment-design-copy m-0 !leading-snug">
        {background.first_column_statement}
      </p>
      {background.first_column_question && (
        <div className="flex items-start gap-4 rounded-lg border border-[#ececf1] bg-white p-4">
          {icon && (
            <div className="flex h-[56px] w-[56px] flex-none items-center justify-center rounded-lg border border-[#f6ead3] bg-[#fffaf0]">
              <img src={icon} alt="" className="max-w-9" />
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-normal">
              {background.definition_title ?? 'What researchers found'}
            </h2>
            <p className="experiment-design-card-copy m-0 !leading-snug">
              {background.first_column_question}
            </p>
          </div>
        </div>
      )}
      {(background.second_column_statement ||
        background.second_column_question) && (
        <div className="flex items-center gap-4 rounded-lg border border-[#e3def7] bg-[#f4f2ff] px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[13px] font-bold tracking-[0.5px] text-[#4a3fa8]">
              FUN FACT
            </span>
            <p className="experiment-design-card-copy m-0 !leading-snug">
              {[
                background.second_column_statement,
                background.second_column_question,
              ]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>
          {background.fun_fact_image && (
            <img
              src={background.fun_fact_image}
              alt=""
              className="w-[60px] flex-none"
            />
          )}
        </div>
      )}
      {media ? (
        <OliverSacksFallback media={media} />
      ) : (
        background.links.map((link) => (
          <div key={link.address} className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline-brand"
              onClick={() => window.open(link.address, '_blank')}
            >
              {link.name}
            </Button>
            {background.link_meta && (
              <span className="text-[15px] text-ink-muted">
                {background.link_meta}
              </span>
            )}
          </div>
        ))
      )}
    </section>
  );
}

/** The video slot in Background's column, holding the local Sacks stand-in and its transcript-length text. */
function OliverSacksFallback({
  media,
}: {
  media: { caption: string; alt: string };
}) {
  return (
    <section className="flex flex-col gap-3 pt-2">
      <h2 className="m-0 text-[22px] font-normal">{media.caption}</h2>
      <div
        role="img"
        aria-label={`Illustration placeholder: ${media.alt}`}
        className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#d4d4de] bg-white"
      >
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-xl"
        >
          🎬
        </span>
        <span className="text-[15px] font-bold text-ink-muted">
          Illustration placeholder (video slot, 16:9)
        </span>
        <span className="text-[14px] text-ink-muted">{media.alt}</span>
      </div>
      <p className="experiment-design-copy m-0 !leading-snug">
        Some people cannot recognize faces — even faces they have seen thousands
        of times. Neurologist Oliver Sacks described this in himself: he might
        walk past a close friend, or his own reflection, without knowing who it
        was.
      </p>
      <p className="experiment-design-copy m-0 !leading-snug">
        Scientists call this condition <b>prosopagnosia</b>, from the Greek for
        &quot;face&quot; and &quot;not knowing.&quot; It is not poor eyesight;
        the brain&apos;s face-recognition system doesn&apos;t process faces the
        usual way.
      </p>
      <p className="experiment-design-copy m-0 !leading-snug">
        Sacks wrote about what this feels like, and about the idea that the
        brain has a dedicated &quot;face area.&quot; That idea led researchers
        to compare the brain&apos;s responses to faces and to other objects.
      </p>
      <p className="experiment-design-copy m-0 !leading-snug">
        <b>Source:</b> Oliver Sacks, &quot;Face-Blind&quot; (2010),{' '}
        <i>The New Yorker</i> / <i>The Mind&apos;s Eye</i>.
      </p>
    </section>
  );
}

function ProtocolView({
  protocol,
  responses,
  flow,
}: {
  protocol: PrepareStepsProps['protocol'];
  responses: ResponseMapping[];
  flow: FlowPhase[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className={EYEBROW}>PROTOCOL</span>
        <h1 className="m-0 [text-wrap:pretty]">{protocol.title}</h1>
        <p className="experiment-design-copy m-0 !leading-snug">
          {protocol.protocol}
        </p>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-4">
        <ResponseDiagram responses={responses} />
        <FlowTimeline phases={flow} />
      </div>
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
function PreviewRunningView({
  responses,
  preview,
}: {
  responses: ResponseMapping[];
  preview?: React.ReactNode;
}) {
  return (
    <section className="flex flex-1 flex-col gap-3">
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
      <KeyLegend responses={responses} />
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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="border-b border-[#e5e5e5] bg-white py-3">
        <div className={COLUMN}>
          <Stepper current={step} onStep={onStep} />
        </div>
      </div>
      <main className="experiment-design-content min-h-0 flex-1 overflow-y-auto bg-app">
        <div className="flex min-h-full flex-col">
          <div className={cn(COLUMN, 'flex flex-1 flex-col pb-5 pt-5')}>
            {step === 'overview' && (
              <OverviewView overview={props.overview} icon={props.icon} />
            )}
            {step === 'background' && (
              <BackgroundView
                background={props.background}
                icon={props.icon}
                media={props.mediaFallback}
              />
            )}
            {step === 'protocol' && (
              <ProtocolView
                protocol={props.protocol}
                responses={props.responses}
                flow={props.flow}
              />
            )}
            {previewIntro && (
              <section className="flex flex-col gap-4">
                <header className="flex flex-col gap-1">
                  <span className={EYEBROW}>PREVIEW</span>
                  <h1 className="m-0 [text-wrap:pretty]">
                    {previewIntro.title}
                  </h1>
                  <p className="experiment-design-copy m-0 !leading-snug">
                    {previewIntro.body}
                  </p>
                </header>
                <KeyLegend responses={props.responses} />
              </section>
            )}
            {previewRunning && (
              <PreviewRunningView
                responses={props.responses}
                preview={props.preview}
              />
            )}
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
          </StepActions>
        </div>
      </main>
    </div>
  );
}
