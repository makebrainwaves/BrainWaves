import React, { ReactNode } from 'react';
import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import { EXPLORE_LESSONS } from '../../constants/exploreLessons';
import eegArt from '../../assets/common/EEG.png';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  ALPHA_NO_EFFECT_BODY,
  ALPHA_RESULT_BODY,
  BLINK_NOT_DETECTED,
  BLINK_STEPS,
  EYES_END_BODY,
  EYES_INTRO_BODY,
  EYES_INTRO_BODY_2,
  EYES_INTERVAL_BODY,
  EYES_PROXY_NOTE,
  QualityState,
  STABLE_COLOR_BY_CHANNEL,
  SensorStatus,
} from './fixtures';
import {
  AlphaExampleCard,
  Countdown,
  FixturePlot,
  FrozenStrip,
  LessonStepPanel,
  NoiseDefinitionCard,
  PlotCard,
  QualitySummary,
  SensorList,
  TraceLegend,
  stepLabel,
} from './ExploreParts';

const SECTION_LABEL =
  'm-0 text-[14px] font-bold uppercase tracking-[0.5px] text-ink-muted';
const BODY_TEXT =
  'm-0 !text-[16px] leading-normal !tracking-normal [text-wrap:pretty]';

/** Four or more call sites across the lesson screens keep these lockstep. */
const stableColors = (channels: string[]) =>
  channels.map((channel) => STABLE_COLOR_BY_CHANNEL[channel]);

/**
 * Redesigned disconnected landing: what Explore is, one primary action, and
 * what waits on the other side. Pairs with Home's Explore card. Explore never
 * records or creates a workspace, and the landing says so.
 */
export function ExploreDisconnected({ onConnect }: { onConnect(): void }) {
  return (
    <div className="flex h-full items-center justify-center px-[24px] py-[24px]">
      <div className="flex w-[900px] items-center gap-[36px] rounded-[6px] bg-white p-[28px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <img
          src={eegArt}
          alt=""
          className="h-[260px] w-[260px] flex-none object-contain"
        />
        <div className="flex min-w-0 flex-col items-start gap-[16px]">
          <h1 className="m-0 !text-[30px] !font-light !leading-tight !tracking-[0.3px]">
            Explore EEG
          </h1>
          <p className={BODY_TEXT}>
            Put on a headset and watch the EEG (electroencephalogram) signal in
            real time — your own brain&apos;s electricity, arriving live. No
            experiment to set up, nothing recorded, no workspace created.
          </p>
          <div className="flex flex-wrap items-center gap-[16px]">
            <Button size="lg" onClick={onConnect}>
              Connect a headset
            </Button>
            <span className="text-[14px] text-ink-muted">
              Takes about 30 seconds
            </span>
          </div>
          <div className="flex w-full flex-col gap-[8px] border-t border-gray-200 pt-[16px]">
            <h2 className={SECTION_LABEL}>Once you&apos;re connected</h2>
            <div className="flex flex-col gap-[4px] text-[16px] leading-[1.5] text-ink">
              <span>1. See whether your signal is usable.</span>
              <span>2. Learn what “noise” means here — it is not a sound.</span>
              <span>
                3. Make your own blink, then your alpha rhythm, show up on the
                plot.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The two lessons as equal, local choices; both actions stay outlined. */
export function LessonPicker({
  disabled,
  onStart,
}: {
  disabled?: boolean;
  onStart(): void;
}) {
  return (
    <section aria-label="Lessons" className="flex flex-none flex-col gap-[8px]">
      <h2 className={cn('m-0', stepLabel)}>Learn with this signal</h2>
      <div className="grid grid-cols-2 gap-[12px] max-[980px]:grid-cols-1">
        {EXPLORE_LESSONS.map((lesson) => (
          <div
            key={lesson.id}
            className="flex items-center gap-[16px] rounded-lg border border-gray-200 bg-white px-[18px] py-[14px]"
          >
            <div className="min-w-0">
              <div className="text-[18px] leading-tight text-ink">
                {lesson.title}
              </div>
              <div className="text-[14px] text-ink-muted">{lesson.detail}</div>
            </div>
            <Button
              variant="outline-brand"
              className="ml-auto flex-none"
              disabled={disabled}
              aria-label={`Start ${lesson.title}`}
              onClick={onStart}
            >
              Start
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface ExploreSurfaceProps {
  /** `waiting` = connected but no data yet; the four quality states after. */
  quality: QualityState | 'waiting';
  sensors: SensorStatus[];
  /** Null shows the explicit waiting state in the plot area. */
  snapshot: EEGSnapshot | null;
  /** Quality colors per channel: the main surface teaches signal quality. */
  colors: string[];
  onStartLesson(): void;
  /** Above the status summary, e.g. the stream-error banner. */
  banner?: ReactNode;
}

/**
 * The connected Explore surface: overall status above the plot, per-sensor
 * detail on the left, live plot and lesson choices on the right. Fills the
 * window without page scroll at 1366×768 and 1280×720.
 */
export function ExploreSurface({
  quality,
  sensors,
  snapshot,
  colors,
  onStartLesson,
  banner,
}: ExploreSurfaceProps) {
  const waiting = quality === 'waiting';
  return (
    <div className="flex h-full min-h-0 flex-col gap-[12px] px-[24px] py-[16px]">
      {banner}
      {waiting ? (
        <div
          role="status"
          className="flex flex-none items-center gap-[10px] rounded-lg border border-gray-200 bg-white px-[18px] py-[12px]"
        >
          <span
            aria-hidden
            className="h-[10px] w-[10px] flex-none rounded-full bg-signal-none"
          />
          <h2 className="m-0 text-[18px] font-normal text-ink">
            Waiting for the headset signal…
          </h2>
          <span className="text-[14px] text-ink-muted">
            Connected — the first seconds of data are on their way.
          </span>
        </div>
      ) : (
        <QualitySummary state={quality} sensors={sensors} />
      )}
      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-[20px] max-[980px]:grid-cols-1">
        <div className="flex min-h-0 min-w-0 flex-col gap-[12px]">
          <SensorList sensors={sensors} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-col gap-[12px]">
          <PlotCard
            caption={snapshot ? 'your signal, live' : 'no signal yet'}
            className="min-h-[120px]"
          >
            {snapshot ? (
              <FixturePlot
                snapshot={snapshot}
                colors={colors}
                width={760}
                height={330}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[16px] text-ink-muted">
                Waiting for the headset signal…
              </div>
            )}
          </PlotCard>
          <LessonPicker disabled={!snapshot} onStart={onStartLesson} />
        </div>
      </div>
    </div>
  );
}

export interface BlinkLessonViewProps {
  /** 0 is the noise-definition intro; 1–4 are the blink steps (plan §5.3). */
  step: 0 | 1 | 2 | 3 | 4;
  /** Adds the stable-color legend (the four-sensor demonstration, §5.2). */
  showLegend?: boolean;
  /** The lesson continues gracefully when detection misses (plan §5.3). */
  notDetected?: boolean;
  snapshot: EEGSnapshot;
  annotations?: PlotAnnotation[];
  comparison?: {
    calm: EEGSnapshot;
    blinking: EEGSnapshot;
    sharedScale: number;
    ratio: number;
  };
  onBack(): void;
  onNext(): void;
  onExit(): void;
}

/**
 * The noise-source lesson: the noise definition first, then the four blink
 * steps, instruction beside the plot with the lesson's own Back/Next/Exit.
 * Traces use stable colors (§5.2) so changing quality colors do not compete.
 */
export function BlinkLessonView({
  step,
  showLegend,
  notDetected,
  snapshot,
  annotations,
  comparison,
  onBack,
  onNext,
  onExit,
}: BlinkLessonViewProps) {
  const channels = snapshot.channels;
  const caught = (annotations ?? []).length;
  return (
    <div className="flex h-full min-h-0 gap-[20px] px-[24px] py-[16px]">
      <LessonStepPanel
        label="Where is this noise coming from?"
        step={step}
        steps={4}
        title={
          step === 0
            ? 'First — what does “noise” mean?'
            : BLINK_STEPS[step - 1].title
        }
        action={step > 0 ? BLINK_STEPS[step - 1].action : undefined}
        body={
          step === 0 ? (
            <div className="flex flex-col gap-[10px]">
              <NoiseDefinitionCard />
              <span>{EYES_INTRO_BODY_2}</span>
            </div>
          ) : (
            BLINK_STEPS[step - 1].body
          )
        }
        backLabel={step === 0 ? 'Exit' : 'Back'}
        nextLabel={
          step === 0
            ? 'Start the steps'
            : step === 4
              ? 'Finish lesson'
              : 'Next'
        }
        onBack={step === 0 ? onExit : onBack}
        onNext={onNext}
        onExit={onExit}
      >
        {step === 2 && (
          <div className="flex flex-col gap-[6px]">
            <span className={stepLabel}>Your prediction</span>
            <div className="flex gap-[8px]">
              <Button variant="outline" aria-pressed={false}>
                A big slow hump
              </Button>
              <Button variant="outline" aria-pressed={false}>
                Not much change
              </Button>
            </div>
          </div>
        )}
        {notDetected && (
          <div
            role="status"
            className="rounded-md border-2 border-accent px-[12px] py-[8px] text-[14px] leading-[1.45] text-ink"
          >
            {BLINK_NOT_DETECTED}
          </div>
        )}
      </LessonStepPanel>
      <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
        {comparison ? (
          <>
            <FrozenStrip
              label="Sitting still · 5 seconds, frozen"
              sublabel="measured on AF7 · AF8"
              snapshot={comparison.calm}
              colors={stableColors(channels)}
              scale={comparison.sharedScale}
            />
            <FrozenStrip
              label="While you were blinking · frozen"
              sublabel="same sensors, same scale"
              snapshot={comparison.blinking}
              colors={stableColors(channels)}
              scale={comparison.sharedScale}
              blinking
              ratio={comparison.ratio}
            />
          </>
        ) : (
          <PlotCard
            caption={
              step === 1
                ? 'watching the frontal sensors (AF7, AF8)'
                : 'your signal, live'
            }
            aside={
              step > 0 && step < 4 ? (
                <span role="status">
                  {caught} {caught === 1 ? 'blink' : 'blinks'} marked
                </span>
              ) : undefined
            }
          >
            <FixturePlot
              snapshot={snapshot}
              annotations={annotations}
              colors={stableColors(channels)}
              width={860}
              height={430}
            />
          </PlotCard>
        )}
        {showLegend && (
          <TraceLegend
            channels={channels}
            colors={stableColors(channels)}
          />
        )}
      </div>
    </div>
  );
}

export type EyesClosedPhase =
  | 'intro'
  | 'countdown'
  | 'interval'
  | 'end'
  | 'review';

export interface EyesClosedViewProps {
  phase: EyesClosedPhase;
  /** 3–2–1 position during the countdown. */
  countdown?: 3 | 2 | 1;
  /** Measured 8–12 Hz ratio (eyes-closed ÷ before); null = not enough data. */
  alphaRatio: number | null;
  showExample?: boolean;
  snapshot: EEGSnapshot;
  annotations?: PlotAnnotation[];
  onBack(): void;
  onNext(): void;
  onExit(): void;
}

/**
 * The single guided eyes-closed sequence (plan §5.4): explain the sounds,
 * Begin, visible countdown, `Close your eyes`, the interval, an unmistakable
 * `Open your eyes`, then the marked interval and the measured comparison.
 */
export function EyesClosedView({
  phase,
  countdown = 3,
  alphaRatio,
  showExample,
  snapshot,
  annotations,
  onBack,
  onNext,
  onExit,
}: EyesClosedViewProps) {
  const running = phase === 'countdown' || phase === 'interval';
  const resultBody =
    alphaRatio == null
      ? 'There is not enough continuous posterior-channel data to compare alpha power. The marked interval is still saved below.'
      : alphaRatio > 1
        ? ALPHA_RESULT_BODY
        : ALPHA_NO_EFFECT_BODY;
  return (
    <div className="flex h-full min-h-0 gap-[20px] px-[24px] py-[16px]">
      <LessonStepPanel
        label="Eyes-closed activity"
        step={0}
        steps={0}
        title={
          {
            intro: 'Close your eyes until the two chimes',
            countdown: 'Starting…',
            interval: 'Close your eyes',
            end: 'Open your eyes',
            review: 'Your eyes-closed interval',
          }[phase]
        }
        action={
          phase === 'interval'
            ? 'Eyes closed until you hear two chimes.'
            : phase === 'end'
              ? 'The two chimes just sounded.'
              : undefined
        }
        body={
          phase === 'intro' ? (
            <div className="flex flex-col gap-[10px]">
              <span>{EYES_INTRO_BODY}</span>
              <span>{EYES_INTRO_BODY_2}</span>
            </div>
          ) : phase === 'countdown' ? (
            'Close your eyes when you hear the single chime.'
          ) : phase === 'interval' ? (
            EYES_INTERVAL_BODY
          ) : phase === 'end' ? (
            EYES_END_BODY
          ) : (
            resultBody
          )
        }
        nextLabel={
          {
            intro: 'Begin eyes-closed activity',
            countdown: 'Starting…',
            interval: 'Recording…',
            end: 'See your result',
            review: 'Finish lesson',
          }[phase]
        }
        backDisabled={running}
        nextDisabled={running}
        onBack={onBack}
        onNext={onNext}
        onExit={onExit}
      >
        {phase === 'intro' && showExample && <AlphaExampleCard />}
        {phase === 'review' && (
          <>
            <div className="text-[14px] font-bold leading-[1.5] text-ink">
              {alphaRatio == null
                ? 'Measured 8–12 Hz power: not enough data this time.'
                : alphaRatio > 1
                  ? `Measured 8–12 Hz power: ${alphaRatio.toFixed(1)}× the five seconds before you closed your eyes.`
                  : 'Measured 8–12 Hz power: about the same as the five seconds before.'}
            </div>
            {showExample && <AlphaExampleCard />}
            <div className="text-[13px] leading-[1.45] text-ink-muted">
              {EYES_PROXY_NOTE}
            </div>
          </>
        )}
      </LessonStepPanel>
      <div className="relative flex min-w-0 flex-1 flex-col gap-[12px]">
        <PlotCard
          caption={
            phase === 'review'
              ? 'the marked interval · frozen copy'
              : 'your signal, live'
          }
          className={running || phase === 'end' ? 'opacity-40' : undefined}
        >
          <FixturePlot
            snapshot={snapshot}
            annotations={annotations}
            colors={stableColors(snapshot.channels)}
            width={860}
            height={430}
          />
        </PlotCard>
        {(running || phase === 'end') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[16px]">
            {phase === 'countdown' ? (
              <Countdown value={countdown} />
            ) : (
              <div className="text-[44px] font-light tracking-[-0.02em] text-ink">
                {phase === 'interval' ? 'Close your eyes' : 'Open your eyes'}
              </div>
            )}
            <div className="text-[16px] text-ink-muted">
              {phase === 'countdown'
                ? 'Close your eyes when the chime sounds.'
                : phase === 'interval'
                  ? 'About ten seconds. Two chimes will end it.'
                  : 'The activity just ended.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}