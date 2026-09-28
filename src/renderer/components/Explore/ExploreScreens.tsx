import React, { ReactNode, useState } from 'react';
import type { Observable } from 'rxjs';
import type { EEGSnapshot } from '../../../shared/eegVizTypes';
import { PLOTTING_INTERVAL } from '../../constants/constants';
import type { SignalQualityData } from '../../constants/interfaces';
import {
  CLEAN_SIGNAL_LESSON,
  EXPLORE_LESSONS,
  LessonId,
} from '../../constants/exploreLessons';
import eegArt from '../../assets/common/EEG.png';
import { channelColors } from '../../utils/eeg/traceColors';
import ExploreSensorCard from '../ExploreSensorCard';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  ALPHA_NO_EFFECT_BODY,
  ALPHA_RESULT_BODY,
  BLINK_NOT_DETECTED,
  BLINK_STEPS,
  EXPLORE_CHANNELS,
  EYES_END_BODY,
  EYES_INTRO_BODY,
  EYES_INTRO_OPENER,
  EYES_INTERVAL_BODY,
  EYES_PROXY_NOTE,
  PLOT_LEGEND,
  REVIEW_SEGMENT_SCALE,
} from './fixtures';
import type { QualityState, SensorStatus } from './quality';
import {
  AlphaExampleCard,
  Countdown,
  FrozenStrip,
  LessonStepPanel,
  NoiseDefinitionCard,
  PlotCard,
  PredictionQuiz,
  QualitySummary,
  SegmentComparison,
  stepLabel,
} from './ExploreParts';

const BODY_TEXT =
  'm-0 !text-[16px] leading-normal !tracking-normal [text-wrap:pretty]';

const LESSON_NOTICE =
  'rounded-md border-2 border-accent px-[12px] py-[8px] text-[14px] leading-[1.45] text-ink';

/**
 * Redesigned disconnected landing: what Explore is, one primary action, and
 * what waits on the other side. Pairs with Home's Explore card.
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
            experiment to set up.
          </p>
          <div className="flex flex-wrap items-center gap-[16px]">
            <Button size="lg" onClick={onConnect}>
              Connect a headset
            </Button>
            <span className="text-[14px] text-ink-muted">
              Takes about 30 seconds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The lessons as equal, local choices; every action stays outlined. */
export function LessonPicker({
  disabled,
  onStart,
}: {
  disabled?: boolean;
  onStart(id: LessonId): void;
}) {
  return (
    <section aria-label="Lessons" className="flex flex-none flex-col gap-[8px]">
      <h2 className={cn('m-0', stepLabel)}>Learn with this signal</h2>
      <div className="grid grid-cols-3 gap-[12px] max-[980px]:grid-cols-1">
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
              onClick={() => onStart(lesson.id)}
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
  /** The device's channels. Pass a stable array: a new one resets the head diagram. */
  channels: string[];
  /** Latest epoch for the sensor card; null while waiting. */
  sample: SignalQualityData | null;
  /** The head diagram's stream: the live stream in the app. */
  head: Observable<SignalQualityData> | null | undefined;
  /**
   * The live plot, drawn in quality colors: the main surface teaches signal
   * quality. `ViewerComponent` in the app, a `SnapshotPlot` in stories.
   */
  livePlot: ReactNode;
  /** Plot caption: `device name · sampling rate Hz`. */
  legend?: string;
  /** Shared hover state between the head diagram and the sensor card. */
  hoveredChannel: string | null;
  onHoveredChannelChange(channel: string | null): void;
  onStartLesson(id: LessonId): void;
  /** Above the status summary, e.g. the stream-error banner. */
  banner?: ReactNode;
}

/**
 * The connected Explore surface: overall status above the plot, the head
 * diagram at left, live plot and lesson choices at right. Fills the window
 * without page scroll at 1366×768 and 1280×720.
 */
export function ExploreSurface({
  quality,
  sensors,
  channels,
  sample,
  head,
  livePlot,
  legend = PLOT_LEGEND,
  hoveredChannel,
  onHoveredChannelChange,
  onStartLesson,
  banner,
}: ExploreSurfaceProps) {
  const waiting = quality === 'waiting';
  return (
    <div className="flex h-full min-h-0 flex-col gap-[10px] px-[24px] py-[10px]">
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
      <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-[20px] max-[980px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-[14px]">
          <SignalQualityIndicatorComponent
            signalQualityObservable={head}
            plottingInterval={PLOTTING_INTERVAL}
            height={250}
            channels={channels}
            hoveredChannel={hoveredChannel}
            onHoveredChannelChange={onHoveredChannelChange}
          />
          <ExploreSensorCard
            channels={channels}
            sample={sample}
            hoveredChannel={hoveredChannel}
            onHoveredChannelChange={onHoveredChannelChange}
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-col gap-[12px]">
          <PlotCard
            caption={waiting ? 'no signal yet' : legend}
            className="min-h-[120px]"
          >
            {waiting ? (
              <div className="flex h-full items-center justify-center text-[16px] text-ink-muted">
                Waiting for the headset signal…
              </div>
            ) : (
              livePlot
            )}
          </PlotCard>
          <LessonPicker disabled={waiting} onStart={onStartLesson} />
        </div>
      </div>
    </div>
  );
}

interface CleanSignalViewProps {
  tip: 1 | 2 | 3;
  /** The live plot in quality colors: this lesson is about signal quality. */
  livePlot: ReactNode;
  legend?: string;
  /** The head diagram's stream: the live stream in the app. */
  head: Observable<SignalQualityData> | null | undefined;
  channels: string[];
  onBack(): void;
  onNext(): void;
  onExit(): void;
}

/**
 * The cleaner-signal lesson: the three tips shared with Collect's lesson
 * sidebar, in the lesson step panel, beside the live plot and head diagram.
 */
export function CleanSignalView({
  tip,
  livePlot,
  legend = PLOT_LEGEND,
  head,
  channels,
  onBack,
  onNext,
  onExit,
}: CleanSignalViewProps) {
  return (
    <div className="flex h-full min-h-0 gap-[20px] px-[24px] py-[16px]">
      <LessonStepPanel
        label="How do I get a cleaner signal?"
        unit="Tip"
        step={tip}
        steps={3}
        title={CLEAN_SIGNAL_LESSON[tip].title}
        body={CLEAN_SIGNAL_LESSON[tip].body}
        backLabel={tip === 1 ? 'Exit' : 'Back'}
        nextLabel={tip === 3 ? 'Finish lesson' : 'Next'}
        onBack={tip === 1 ? onExit : onBack}
        onNext={onNext}
        onExit={onExit}
      />
      <div className="flex min-w-0 flex-1 gap-[20px]">
        <PlotCard caption={legend}>{livePlot}</PlotCard>
        <div className="w-[260px] flex-none">
          <SignalQualityIndicatorComponent
            signalQualityObservable={head}
            plottingInterval={PLOTTING_INTERVAL}
            height={250}
            channels={channels}
          />
        </div>
      </div>
    </div>
  );
}

export interface BlinkLessonViewProps {
  /** 0 is the noise-definition intro; 1–4 are the blink steps (plan §5.3). */
  step: 0 | 1 | 2 | 3 | 4;
  /** The lesson continues gracefully when detection misses (plan §5.3). */
  notDetected?: boolean;
  /** Pre-answered prediction, for the answered-state story. */
  defaultPrediction?: 'hump' | 'flat';
  /** The live plot, until step 4's comparison freezes. */
  livePlot: ReactNode;
  /** Blinks marked on the live plot, counted on steps 1–2. */
  blinkCount?: number;
  legend?: string;
  /** The device's full channel list, so frozen strips keep each channel's color. */
  deviceChannels?: string[];
  comparison?: {
    calm: EEGSnapshot;
    blinking: EEGSnapshot;
    ratio: number;
  };
  /** Step 4's plot range as a µV half-range, for the live plot to follow. */
  onRangeChange?(halfRange: number): void;
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
  notDetected,
  defaultPrediction,
  livePlot,
  blinkCount = 0,
  legend = PLOT_LEGEND,
  deviceChannels = EXPLORE_CHANNELS,
  comparison,
  onRangeChange,
  onBack,
  onNext,
  onExit,
}: BlinkLessonViewProps) {
  const [range, setRange] = useState(150);
  const colors = comparison
    ? channelColors(comparison.calm.channels, deviceChannels)
    : [];
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
        action={
          step > 0 && !(step === 4 && !comparison)
            ? BLINK_STEPS[step - 1].action
            : undefined
        }
        body={
          step === 0 ? (
            <NoiseDefinitionCard />
          ) : step === 4 && !comparison ? (
            BLINK_STEPS[3].action
          ) : (
            BLINK_STEPS[step - 1].body
          )
        }
        backLabel={step === 0 ? 'Exit' : 'Back'}
        nextLabel={
          step === 0 ? 'Start the steps' : step === 4 ? 'Finish lesson' : 'Next'
        }
        onBack={step === 0 ? onExit : onBack}
        onNext={onNext}
        onExit={onExit}
      >
        {step === 2 && <PredictionQuiz defaultAnswer={defaultPrediction} />}
        {notDetected && (
          <div role="status" className={LESSON_NOTICE}>
            {BLINK_NOT_DETECTED}
          </div>
        )}
      </LessonStepPanel>
      <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
        {step === 4 && (
          <div
            role="radiogroup"
            aria-label="Plot range"
            className="flex flex-none items-center gap-[10px]"
          >
            <span className={stepLabel}>Plot range</span>
            {[
              { value: 150, text: '±150 µV' },
              { value: 50, text: '±50 µV' },
            ].map((option) => {
              const active = range === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setRange(option.value);
                    onRangeChange?.(option.value);
                  }}
                  className={cn(
                    'rounded-md border-2 px-[10px] py-[4px] text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    active
                      ? 'border-brand bg-brand-light text-brand'
                      : 'border-gray-200 bg-white text-ink-muted hover:border-brand hover:text-ink'
                  )}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
        )}
        {comparison ? (
          <>
            <FrozenStrip
              label="Sitting still · 5 seconds"
              sublabel="your recent signal, paused · AF7 · AF8"
              snapshot={comparison.calm}
              colors={colors}
              scale={range}
            />
            <FrozenStrip
              label="While you were blinking · 5 seconds"
              sublabel="your recent signal, paused · same scale"
              snapshot={comparison.blinking}
              colors={colors}
              scale={range}
              blinking
              ratio={comparison.ratio}
            />
          </>
        ) : (
          <PlotCard
            caption={
              step === 1 ? 'watching the frontal sensors (AF7, AF8)' : legend
            }
            aside={
              step > 0 && step < 3 ? (
                <span role="status">
                  {blinkCount} {blinkCount === 1 ? 'blink' : 'blinks'} marked
                </span>
              ) : undefined
            }
          >
            {livePlot}
          </PlotCard>
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
  /** Measured comparison (eyes-closed ÷ before); null = not enough data. */
  rhythmRatio: number | null;
  showExample?: boolean;
  /** The live plot for every phase before review. */
  livePlot: ReactNode;
  /** Frozen equal-length review segments; null = not enough data to show. */
  segments?: { open: EEGSnapshot; closed: EEGSnapshot } | null;
  legend?: string;
  /** The device's full channel list, so the segments keep each channel's color. */
  deviceChannels?: string[];
  /** Why the activity could not start, shown in the step panel. */
  error?: string;
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
  rhythmRatio,
  showExample,
  livePlot,
  segments,
  legend = PLOT_LEGEND,
  deviceChannels = EXPLORE_CHANNELS,
  error,
  onBack,
  onNext,
  onExit,
}: EyesClosedViewProps) {
  const running = phase === 'countdown' || phase === 'interval';
  const increase = rhythmRatio != null && rhythmRatio > 1;
  const resultBody =
    rhythmRatio == null
      ? 'There is not enough continuous data from the back of your head to compare. The marked interval is still saved below.'
      : increase
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
            intro: EYES_INTRO_OPENER,
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
          phase === 'intro'
            ? EYES_INTRO_BODY
            : phase === 'countdown'
              ? 'Close your eyes when you hear the single chime.'
              : phase === 'interval'
                ? EYES_INTERVAL_BODY
                : phase === 'end'
                  ? EYES_END_BODY
                  : resultBody
        }
        nextLabel={
          {
            intro: 'Begin',
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
        {error && (
          <div role="alert" className={LESSON_NOTICE}>
            {error}
          </div>
        )}
        {phase === 'intro' && showExample && <AlphaExampleCard />}
        {phase === 'review' && (
          <>
            <div className="text-[14px] font-bold leading-[1.5] text-ink">
              {rhythmRatio == null
                ? 'Comparison: not enough data this time.'
                : increase
                  ? `The steady rhythm from the back of your head was ${rhythmRatio.toFixed(1)}× as strong with your eyes closed.`
                  : 'The steady rhythm from the back of your head was about as strong as before.'}
            </div>
            {showExample && <AlphaExampleCard />}
            <div className="text-[13px] leading-[1.45] text-ink-muted">
              {EYES_PROXY_NOTE}
            </div>
          </>
        )}
      </LessonStepPanel>
      <div className="relative flex min-w-0 flex-1 flex-col gap-[12px]">
        {phase === 'review' ? (
          <PlotCard
            paused
            caption="your eyes-closed interval, paused · same scale"
          >
            {segments ? (
              <SegmentComparison
                open={segments.open}
                closed={segments.closed}
                colors={channelColors(segments.open.channels, deviceChannels)}
                scale={REVIEW_SEGMENT_SCALE}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[16px] text-ink-muted">
                Not enough continuous data to show this interval.
              </div>
            )}
          </PlotCard>
        ) : (
          <PlotCard
            caption={legend}
            className={running || phase === 'end' ? 'opacity-40' : undefined}
          >
            {livePlot}
          </PlotCard>
        )}
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
