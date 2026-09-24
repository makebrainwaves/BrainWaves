import React from 'react';
import { Button } from '../ui/button';

export type PrepareStepId = 'overview' | 'background' | 'protocol' | 'preview';

export interface FlowPhase {
  label: string;
  count?: number;
}

export interface PrepareStepsProps {
  step: PrepareStepId;
  heading: string;
  modality: 'eeg' | 'behavior';
  overview: { title: string; overview: string; links: { address: string; name: string }[] };
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
  protocol: {
    title: string;
    protocol: string;
    condition_first_img: string;
    condition_first_title: string;
    condition_first: string;
    condition_second_img: string;
    condition_second_title: string;
    condition_second: string;
    condition_first_key?: string;
    condition_second_key?: string;
    pacing?: string;
    links?: { address: string; name: string }[];
  };
  expectedKeys: { label: string; key?: string }[];
  flow: FlowPhase[];
  icon?: string;
  onStep: (step: PrepareStepId) => void;
  onCollect: () => void;
  onPreviewStart: () => void;
  onPreviewStop: () => void;
  onPreviewAgain: () => void;
  isPreviewing: boolean;
  hasPreviewed: boolean;
}

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
              className={`
                flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold
                tracking-[0.5px] transition-colors focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                ${
                  isCurrent
                    ? 'bg-ink text-white'
                    : isPast
                      ? 'bg-brand-light text-brand hover:bg-brand hover:text-white'
                      : 'bg-white text-ink-muted hover:bg-[#f3f3f8] hover:text-ink'
                }
              `}
            >
              <span
                className={`
                  flex h-5 w-5 items-center justify-center rounded-full text-[11px]
                  ${
                    isCurrent
                      ? 'bg-white text-ink'
                      : isPast
                        ? 'bg-brand text-white'
                        : 'border border-ink-faint text-ink-muted'
                  }
                `}
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

function KeyLegend({ keys }: { keys: { label: string; key?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {keys.map(({ label, key }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-lg border border-[#ececf1] bg-white px-3 py-2"
        >
          {key ? (
            <kbd className="flex h-7 min-w-[28px] items-center justify-center rounded-md border-2 border-ink bg-white px-1.5 text-[14px] font-bold">
              {key}
            </kbd>
          ) : null}
          <span className="text-[15px] text-ink">{label}</span>
        </div>
      ))}
    </div>
  );
}

function ConditionCard({
  title,
  description,
  keyLabel,
}: {
  title: string;
  description: string;
  keyLabel?: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-[#ececf1] bg-white p-5">
      <h3 className="m-0 text-xl font-normal">{title}</h3>
      <p className="m-0 text-[17px] leading-relaxed text-ink">
        {description}
        {keyLabel ? (
          <>
            {' '}
            <kbd className="ml-1 inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-md border-2 border-ink text-[15px] font-bold">
              {keyLabel}
            </kbd>
          </>
        ) : null}
      </p>
    </article>
  );
}

function FlowInfographic({ phases }: { phases: FlowPhase[] }) {
  return (
    <div className="rounded-lg border border-[#e3def7] bg-[#f4f2ff] p-5">
      <h3 className="m-0 mb-4 text-xl font-normal">What happens in this task</h3>
      <ol className="m-0 flex flex-wrap items-center gap-2 p-0">
        {phases.map((phase, i) => (
          <React.Fragment key={phase.label}>
            <li className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[15px] text-ink shadow-sm">
              {typeof phase.count === 'number' ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                  {phase.count}
                </span>
              ) : null}
              {phase.label}
            </li>
            {i < phases.length - 1 && (
              <li aria-hidden className="text-ink-muted">
                →
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </div>
  );
}

function OverviewView({
  overview,
  icon,
  onNext,
}: {
  overview: PrepareStepsProps['overview'];
  icon?: string;
  onNext: () => void;
}) {
  return (
    <section className="flex flex-wrap-reverse items-start gap-12">
      <div className="flex min-w-0 max-w-[680px] flex-[1_1_420px] flex-col gap-4">
        <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
          THE BIG QUESTION
        </span>
        <h1 className="[text-wrap:pretty]">{overview.title}</h1>
        {overview.overview.split(/\n\s*\n/).map((paragraph) => (
          <p key={paragraph} className="experiment-design-copy">
            {paragraph}
          </p>
        ))}
        <div className="mt-2">
          <Button size="lg" onClick={onNext}>
            Next: Background →
          </Button>
        </div>
      </div>
      {icon && (
        <div className="flex flex-[0_1_260px] items-center justify-center pt-2">
          <img
            src={icon}
            alt={overview.title}
            className="h-auto w-full max-w-60"
          />
        </div>
      )}
    </section>
  );
}

function BackgroundView({
  background,
  icon,
  onBack,
  onNext,
}: {
  background: PrepareStepsProps['background'];
  icon?: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex max-w-[680px] flex-col gap-2.5">
        <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
          BACKGROUND · 2 MIN READ
        </span>
        <h1 className="[text-wrap:pretty]">{background.title ?? 'Background'}</h1>
      </header>
      <p className="experiment-design-copy max-w-[680px]">
        {background.first_column_statement}
      </p>
      {background.first_column_question && (
        <div className="flex max-w-[680px] items-start gap-5 rounded-lg border border-[#ececf1] bg-white p-6">
          {icon && (
            <div className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-lg border border-[#f6ead3] bg-[#fffaf0]">
              <img src={icon} alt="" className="max-w-11" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-normal">
              {background.definition_title ?? 'What researchers found'}
            </h2>
            <p className="experiment-design-card-copy">
              {background.first_column_question}
            </p>
          </div>
        </div>
      )}
      {(background.second_column_statement || background.second_column_question) && (
        <div className="flex max-w-[680px] items-center gap-5 rounded-lg border border-[#e3def7] bg-[#f4f2ff] px-6 py-5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-[13px] font-bold tracking-[0.5px] text-[#4a3fa8]">
              FUN FACT
            </span>
            <p className="experiment-design-card-copy">
              {[background.second_column_statement, background.second_column_question]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>
          {background.fun_fact_image && (
            <img
              src={background.fun_fact_image}
              alt=""
              className="w-[88px] flex-none"
            />
          )}
        </div>
      )}
      {background.links.map((link) => (
        <div key={link.address} className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline-brand"
            onClick={() => window.open(link.address, '_blank')}
          >
            {link.name}
          </Button>
          {background.link_meta && (
            <span className="text-[15px] text-ink-muted">{background.link_meta}</span>
          )}
        </div>
      ))}
      <div className="mt-2 flex gap-3">
        <Button size="lg" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button size="lg" onClick={onNext}>
          Next: Protocol →
        </Button>
      </div>
    </section>
  );
}

function ProtocolView({
  protocol,
  expectedKeys,
  flow,
  onBack,
  onNext,
}: {
  protocol: PrepareStepsProps['protocol'];
  expectedKeys: { label: string; key?: string }[];
  flow: FlowPhase[];
  onBack: () => void;
  onNext: () => void;
}) {
  const conditions = [
    {
      title: protocol.condition_first_title,
      description: protocol.condition_first,
      key: protocol.condition_first_key,
    },
    {
      title: protocol.condition_second_title,
      description: protocol.condition_second,
      key: protocol.condition_second_key,
    },
  ];
  return (
    <section className="flex flex-col gap-5">
      <header className="flex max-w-[680px] flex-col gap-2.5">
        <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
          PROTOCOL
        </span>
        <h1 className="[text-wrap:pretty]">{protocol.title}</h1>
        <p className="experiment-design-copy">{protocol.protocol}</p>
      </header>
      <div className="grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {conditions.map(
          (condition) =>
            condition.title && (
              <ConditionCard
                key={condition.title}
                title={condition.title}
                description={condition.description}
                keyLabel={condition.key}
              />
            )
        )}
      </div>
      <FlowInfographic phases={flow} />
      {protocol.pacing && (
        <div className="max-w-[680px] rounded-lg border-l-4 border-brand bg-white p-4 shadow-sm">
          <p className="m-0 text-[17px] leading-relaxed text-ink">
            <b>Pacing:</b> {protocol.pacing}
          </p>
        </div>
      )}
      <KeyLegend keys={expectedKeys} />
      <div className="mt-2 flex gap-3">
        <Button size="lg" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button size="lg" onClick={onNext}>
          Try the experiment →
        </Button>
      </div>
    </section>
  );
}

function PreviewStoppedView({
  expectedKeys,
  onPreviewStart,
  onCollect,
}: {
  expectedKeys: { label: string; key?: string }[];
  onPreviewStart: () => void;
  onCollect: () => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex max-w-[680px] flex-col gap-2.5">
        <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
          PREVIEW
        </span>
        <h1 className="[text-wrap:pretty]">See it the way they will</h1>
        <p className="experiment-design-copy">
          Nothing is recorded during a preview. Try the experiment, then decide
          when you are ready to collect real data.
        </p>
      </header>
      <KeyLegend keys={expectedKeys} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onPreviewStart}>
          Try the experiment →
        </Button>
        <Button size="lg" variant="outline-brand" onClick={onCollect}>
          Run &amp; record
        </Button>
      </div>
    </section>
  );
}

function PreviewRunningView({
  expectedKeys,
  onPreviewStop,
}: {
  expectedKeys: { label: string; key?: string }[];
  onPreviewStop: () => void;
}) {
  return (
    <section className="flex h-full flex-col gap-4">
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border border-[#ececf1] bg-white px-4 py-3"
      >
        <span className="rounded-full bg-brand px-2 py-0.5 text-[12px] font-bold uppercase tracking-[0.5px] text-white">
          Preview
        </span>
        <span className="text-[15px] text-ink-muted">
          Nothing is being recorded
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 rounded-lg border-2 border-dashed border-[#d4d4de] bg-white p-6">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold uppercase tracking-[0.5px] text-ink-muted">
            Experiment area
          </span>
          <Button variant="destructive" onClick={onPreviewStop}>
            Stop preview
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-md bg-[#f9f9f9]">
          <span className="text-[15px] text-ink-muted">
            Participant screen would appear here
          </span>
        </div>
      </div>
      <KeyLegend keys={expectedKeys} />
    </section>
  );
}

function PreviewFinishedView({
  expectedKeys,
  onPreviewAgain,
  onCollect,
}: {
  expectedKeys: { label: string; key?: string }[];
  onPreviewAgain: () => void;
  onCollect: () => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex max-w-[680px] flex-col gap-2.5">
        <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
          PREVIEW
        </span>
        <h1 className="[text-wrap:pretty]">Ready to record?</h1>
        <p className="experiment-design-copy">
          Preview is done. When a participant is ready, run and record real data.
        </p>
      </header>
      <KeyLegend keys={expectedKeys} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onCollect}>
          Run &amp; record →
        </Button>
        <Button size="lg" variant="outline-brand" onClick={onPreviewAgain}>
          Preview again
        </Button>
      </div>
    </section>
  );
}

/**
 * Prepare steps: overview → background → protocol → preview, rendered as
 * pure props. The local stepper is a rounded pill sequence, visually distinct
 * from the global gold-underline workflow bar.
 */
export default function PrepareSteps(props: PrepareStepsProps) {
  const { step } = props;

  function transitionTo(nextStep: PrepareStepId) {
    props.onStep(nextStep);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="border-b border-[#e5e5e5] bg-white px-[24px] py-3">
        <Stepper current={step} onStep={transitionTo} />
      </div>
      <main className="experiment-design-content min-h-0 flex-1 overflow-y-auto bg-app">
        <div className="w-full px-9 pb-12 pt-9">
          {step === 'overview' && (
            <OverviewView
              overview={props.overview}
              icon={props.icon}
              onNext={() => transitionTo('background')}
            />
          )}
          {step === 'background' && (
            <BackgroundView
              background={props.background}
              icon={props.icon}
              onBack={() => transitionTo('overview')}
              onNext={() => transitionTo('protocol')}
            />
          )}
          {step === 'protocol' && (
            <ProtocolView
              protocol={props.protocol}
              expectedKeys={props.expectedKeys}
              flow={props.flow}
              onBack={() => transitionTo('background')}
              onNext={() => transitionTo('preview')}
            />
          )}
          {step === 'preview' && !props.isPreviewing && !props.hasPreviewed && (
            <PreviewStoppedView
              expectedKeys={props.expectedKeys}
              onPreviewStart={props.onPreviewStart}
              onCollect={props.onCollect}
            />
          )}
          {step === 'preview' && props.isPreviewing && (
            <PreviewRunningView
              expectedKeys={props.expectedKeys}
              onPreviewStop={props.onPreviewStop}
            />
          )}
          {step === 'preview' && !props.isPreviewing && props.hasPreviewed && (
            <PreviewFinishedView
              expectedKeys={props.expectedKeys}
              onPreviewAgain={props.onPreviewAgain}
              onCollect={props.onCollect}
            />
          )}
        </div>
      </main>
    </div>
  );
}
