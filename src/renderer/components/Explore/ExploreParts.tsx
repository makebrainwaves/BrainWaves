import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  ALPHA_EXAMPLE_CAPTION,
  CLOSED_SEGMENT,
  EXPLORE_CHANNELS,
  NOISE_DEFINITION,
  NOISE_SETTLING_NOTE,
  OPEN_SEGMENT,
  REVIEW_SEGMENT_SCALE,
} from './fixtures';
import { channelColor } from '../../utils/eeg/traceColors';
import { QUALITY_STATE_TONE, QualityState, SensorStatus, qualityCopy } from './quality';

/** Small uppercase label for lesson step counters and section titles. */
export const stepLabel =
  'text-[12px] font-bold uppercase tracking-[0.5px] text-ink-muted';

const PLOT_MARGIN = { top: 20, right: 10, bottom: 30, left: 44 };
const LABEL_HEIGHT = 22;
const LABEL_RADIUS = LABEL_HEIGHT / 2;
const LABEL_GUTTER = LABEL_HEIGHT + 8;

/** Matches `EEGViewer`'s annotation tones so integration swaps in cleanly. */
const TONE_STYLES = {
  blink: {
    fill: 'rgba(255, 193, 7, 0.18)',
    stroke: '#ffc107',
    text: '#1a1a1a',
  },
  'eyes-closed': {
    fill: 'rgba(0, 124, 112, 0.10)',
    stroke: '#007c70',
    text: '#ffffff',
  },
} as const;

/** Glyph-width estimate; the real viewer measures with `getBbox`. */
const PILL_FONT = 12;

const AXIS_FONT = '11px Lato, "Helvetica Neue", sans-serif';
const PILL_FONT_STACK = `${PILL_FONT}px Lato, "Helvetica Neue", sans-serif`;

interface SnapshotPlotProps {
  /** A frozen snapshot, or a synthetic series standing in for the live viewer in Storybook. */
  snapshot: EEGSnapshot;
  annotations?: PlotAnnotation[];
  /** Per-channel stroke colors, index-aligned with `snapshot.channels`. */
  colors: string[];
  /** Symmetric µV half-range, like `ViewerComponent.amplitudeScale`. */
  amplitudeScale?: number;
  width?: number;
  height?: number;
  /**
   * `band` draws the real viewer's annotation bands; `tick` is the fallback
   * marker for detectors that report a detection time instead of an interval.
   */
  markerStyle?: 'band' | 'tick';
  /** Off for compact example plots. */
  showAxis?: boolean;
  /** Near-zero margins for compact example plots. */
  tight?: boolean;
}

/**
 * Static SVG plot of one `EEGSnapshot`: the app's frozen plots (comparison
 * strips, review segments, the example) and Storybook's stand-in for the live
 * `<webview>` viewer (`ViewerComponent` / `EEGViewer`, Electron-only). Same
 * geometry as the real viewer: 20/10/30/44 margins, channels stacked in equal
 * bands, channel labels on the left, a whole-second offset axis, and
 * annotation bands with pill labels.
 */
export function SnapshotPlot({
  snapshot,
  annotations = [],
  colors,
  amplitudeScale = 200,
  width = 900,
  height = 420,
  markerStyle = 'band',
  showAxis = true,
  tight = false,
}: SnapshotPlotProps) {
  const clipId = useId();
  const margin = tight ? { top: 2, right: 2, bottom: 2, left: 2 } : PLOT_MARGIN;
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const count = snapshot.channels.length;
  const bandH = plotH / count;
  const span = snapshot.endTime - snapshot.startTime;
  const xAt = (t: number) => ((t - snapshot.startTime) / span) * plotW;

  const paths = snapshot.data.map((samples, i) => {
    const center = samples.reduce((a, b) => a + b, 0) / samples.length;
    const top = i * bandH;
    const yAt = (v: number) =>
      top + ((center + amplitudeScale - v) / (2 * amplitudeScale)) * bandH;
    // Same 2× downsampling as the real viewer's line paths.
    let d = '';
    for (let n = 0; n < samples.length; n += 2) {
      const x = xAt(snapshot.startTime + (n / samples.length) * span);
      d += `${d ? 'L' : 'M'}${x.toFixed(1)},${yAt(samples[n]).toFixed(1)}`;
    }
    return d;
  });

  // Whole-second offset ticks only, mirroring `EEGViewer.buildTimeAxis`.
  const maxTicks = Math.max(2, Math.floor(plotW / 80));
  const tickStep = Math.max(1, Math.ceil(span / 1000 / maxTicks)) * 1000;
  const ticks: number[] = [];
  for (let offset = 0; offset >= -span; offset -= tickStep) ticks.push(offset);

  const bands = annotations
    .filter(
      (annotation) =>
        (annotation.endTime == null || annotation.endTime >= snapshot.startTime) &&
        annotation.startTime <= snapshot.endTime
    )
    .map((annotation) => {
      const startX = xAt(annotation.startTime);
      const endX =
        annotation.endTime != null ? xAt(annotation.endTime) : plotW;
      return {
        annotation,
        x: Math.max(0, Math.min(plotW, startX)),
        width: Math.max(0, Math.min(plotW, endX) - Math.max(0, startX)),
        ended: annotation.endTime != null,
      };
    });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label={`EEG trace, ${count} channels stacked over time`}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        <g clipPath={`url(#${clipId})`}>
          {paths.map((d, i) => (
            <path
              key={snapshot.channels[i]}
              d={d}
              fill="none"
              stroke={colors[i]}
              strokeWidth={1.75}
            />
          ))}
        </g>
        {markerStyle === 'tick' &&
          annotations
            .filter(
              (a) =>
                a.startTime >= snapshot.startTime &&
                a.startTime <= snapshot.endTime
            )
            .map((a) => (
              <rect
                key={a.id}
                x={xAt(a.startTime) - 1.5}
                y={0}
                width={3}
                height={plotH}
                rx={1.5}
                fill={TONE_STYLES[a.tone].stroke}
              />
            ))}
        {markerStyle !== 'tick' &&
          bands.map(({ annotation, x, width: bandWidth, ended }) => {
          const style = TONE_STYLES[annotation.tone];
          const solid = annotation.tone === 'eyes-closed';
          const pillW = (text: string) =>
            text.length * (PILL_FONT * 0.55) + 18;
          const startW = pillW(annotation.label);
          const endW = annotation.endLabel ? pillW(annotation.endLabel) : 0;
          return (
            <g key={annotation.id}>
              <rect
                x={x}
                y={0}
                width={bandWidth}
                height={plotH}
                fill={style.fill}
              />
              <line
                x1={x}
                x2={x}
                y1={0}
                y2={plotH}
                stroke={style.stroke}
                strokeWidth={solid ? 2 : 1}
                strokeDasharray={solid ? undefined : '4 3'}
              />
              {ended && (
                <line
                  x1={x + bandWidth}
                  x2={x + bandWidth}
                  y1={0}
                  y2={plotH}
                  stroke={style.stroke}
                  strokeWidth={solid ? 2 : 1}
                  strokeDasharray={solid ? undefined : '4 3'}
                />
              )}
              {bandWidth > 40 && (
                <>
                  <g
                    transform={`translate(${Math.max(
                      0,
                      Math.min(plotW - startW, x + 6 - startW)
                    )},-6)`}
                  >
                    <rect
                      width={startW}
                      height={LABEL_HEIGHT}
                      rx={LABEL_RADIUS}
                      fill={style.stroke}
                    />
                    <text
                      x={startW / 2}
                      y={LABEL_HEIGHT / 2}
                      dy="0.35em"
                      textAnchor="middle"
                      fill={style.text}
                      style={{ font: PILL_FONT_STACK }}
                    >
                      {annotation.label}
                    </text>
                  </g>
                  {ended && annotation.endLabel && (
                    <g
                      transform={`translate(${Math.max(
                        0,
                        Math.min(plotW - endW, x + bandWidth + 6)
                      )},${plotH - LABEL_HEIGHT - 4})`}
                    >
                      <rect
                        width={endW}
                        height={LABEL_HEIGHT}
                        rx={LABEL_RADIUS}
                        fill={style.stroke}
                      />
                      <text
                        x={endW / 2}
                        y={LABEL_HEIGHT / 2}
                        dy="0.35em"
                        textAnchor="middle"
                        fill={style.text}
                        style={{ font: PILL_FONT_STACK }}
                      >
                        {annotation.endLabel}
                      </text>
                    </g>
                  )}
                </>
              )}
            </g>
          );
        })}
        {showAxis && (
          <>
        <line
          x1={0}
          x2={plotW}
          y1={plotH}
          y2={plotH}
          stroke="#bfbfbf"
          strokeWidth={1}
        />
        {ticks.map((offset) => (
          <g key={offset} transform={`translate(${xAt(snapshot.endTime + offset)},0)`}>
            <line x1={0} x2={0} y1={plotH} y2={plotH + 6} stroke="#bfbfbf" />
            <text
              x={0}
              y={plotH + 18}
              textAnchor="middle"
              fill="#666"
              style={{ font: AXIS_FONT }}
            >
              {Math.round(offset / 1000)}s
            </text>
          </g>
        ))}
        {snapshot.channels.map((channel, i) => (
          <g key={channel} transform={`translate(0,${i * bandH + bandH / 2})`}>
            <line x1={-2} x2={0} y1={0} y2={0} stroke="#bfbfbf" />
            <text
              x={-6}
              dy="0.32em"
              textAnchor="end"
              fill="#666"
              style={{ font: AXIS_FONT }}
            >
              {channel}
            </text>
          </g>
        ))}
          </>
        )}
        <clipPath id={clipId}>
          <rect x={0} y={-LABEL_GUTTER} width={plotW} height={plotH + 2 * LABEL_GUTTER} />
        </clipPath>
      </g>
    </svg>
  );
}

/**
 * A plot card: one caption line above a plot that fills the given space. The
 * dot marks a live plot; a `paused` capture of the student's signal has none.
 */
export function PlotCard({
  caption,
  aside,
  children,
  className,
  paused,
}: {
  caption: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  paused?: boolean;
}) {
  return (
    <figure
      className={cn(
        'm-0 flex min-h-0 min-w-0 flex-1 flex-col gap-[8px] rounded-lg border border-gray-200 bg-white px-[18px] py-[14px]',
        className
      )}
    >
      <figcaption className="flex min-h-[20px] flex-none items-center justify-between gap-[12px] text-[13px] text-ink-muted">
        <span className="flex items-center gap-[8px]">
          {!paused && (
            <span
              aria-hidden
              className="h-[8px] w-[8px] rounded-full bg-brand"
            />
          )}
          {caption}
        </span>
        {aside}
      </figcaption>
      <div className="min-h-0 flex-1">{children}</div>
    </figure>
  );
}

/**
 * Overall signal status above the plot (plan §5.1). Words explain, color only
 * supports; the sensor strip repeats every state in text.
 */
export function QualitySummary({
  state,
  sensors,
  className,
}: {
  state: QualityState;
  /** Adjust names the sensors whose quality is BAD. */
  sensors: SensorStatus[];
  className?: string;
}) {
  const scenario = qualityCopy(state, sensors);
  // The card earns its place in the yellow/red states; ready stays a light row.
  const light = scenario.action === '';
  return (
    <section
      aria-label="Signal status"
      className={cn(
        'flex flex-none flex-wrap items-baseline gap-x-[14px] gap-y-[2px]',
        !light &&
          'rounded-lg border border-gray-200 bg-white px-[18px] py-[10px]',
        className
      )}
    >
      <span className="flex items-center gap-[8px]">
        <span
          aria-hidden
          className="h-[10px] w-[10px] flex-none rounded-full"
          style={{ background: QUALITY_STATE_TONE[state] }}
        />
        <h2 className="m-0 text-[18px] font-normal text-ink">
          {scenario.heading}
        </h2>
      </span>
      {scenario.action && (
        <span className="text-[14px] leading-[1.4] text-ink-muted">
          {scenario.action}
        </span>
      )}
    </section>
  );
}

/** The plain-language definition of noise (plan §5.1), before any judging. */
export function NoiseDefinitionCard() {
  return (
    <section
      aria-label="What noise means"
      className="flex flex-none flex-col gap-[8px] rounded-lg border border-gray-200 bg-white px-[16px] py-[12px]"
    >
      <h2 className={cn('m-0', stepLabel)}>What “noise” means here</h2>
      <p className="m-0 !text-[15px] !tracking-normal leading-[1.5] text-ink">
        {NOISE_DEFINITION}
      </p>
      <p className="m-0 !text-[13px] !tracking-normal leading-[1.5] text-ink-muted">
        {NOISE_SETTLING_NOTE}
      </p>
    </section>
  );
}

/**
 * The lesson step panel in the Analyze walkthrough's idiom: step counter with
 * gold progress pips, local Exit, fading step copy, Back / Next at the bottom.
 */
export function LessonStepPanel({
  label,
  step,
  steps,
  title,
  action,
  body,
  children,
  onBack,
  onNext,
  onExit,
  backLabel = 'Back',
  nextLabel = 'Next',
  unit = 'Step',
  backDisabled,
  nextDisabled,
}: {
  /** Uppercase step counter prefix, e.g. `Where is this noise coming from?`. */
  label: string;
  /** Current step; 0 hides the counter and pips (pre-step screens). */
  step: number;
  steps: number;
  /** Counter noun: `Step 2 of 4`, `Tip 2 of 3`. */
  unit?: string;
  title: string;
  /** The expected action at a glance (plan §5.2). */
  action?: string;
  body: ReactNode;
  children?: ReactNode;
  onBack(): void;
  onNext(): void;
  onExit(): void;
  backLabel?: string;
  nextLabel?: string;
  backDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  return (
    <aside
      aria-label="Lesson steps"
      className="flex w-[340px] flex-none flex-col gap-[12px] rounded-lg border border-gray-200 bg-white px-[18px] py-[14px]"
    >
      <div className="flex items-center justify-between gap-[8px]">
        <span className={stepLabel} role="status">
          {label}
          {step > 0 && ` · ${unit} ${step} of ${steps}`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="flex-none text-ink-muted"
          onClick={onExit}
        >
          Exit lesson ✕
        </Button>
      </div>
      {step > 0 && (
        <div className="flex gap-[6px]" aria-hidden>
          {Array.from({ length: steps }, (_, i) => i + 1).map((s) => (
            <span
              key={s}
              className={cn(
                'h-[6px] flex-1 rounded-full',
                s === step
                  ? 'bg-accent'
                  : s < step
                    ? 'bg-accent-light'
                    : 'bg-ink-faint'
              )}
            />
          ))}
        </div>
      )}
      <div
        key={step}
        className="explore-step-copy flex min-h-0 flex-1 flex-col gap-[10px] overflow-y-auto"
      >
        <h2
          ref={heading}
          tabIndex={-1}
          className="m-0 text-[24px] font-light leading-tight text-ink outline-none"
        >
          {title}
        </h2>
        {action && (
          <div className="text-[15px] font-bold leading-[1.45] text-ink">
            {action}
          </div>
        )}
        <div className="text-[15px] leading-[1.5] text-ink-muted">{body}</div>
        {children}
      </div>
      <div className="flex flex-none gap-[8px]">
        <Button
          variant="outline-brand"
          size="lg"
          onClick={onBack}
          disabled={backDisabled}
        >
          {backLabel}
        </Button>
        <Button size="lg" className="flex-1" onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </aside>
  );
}

/**
 * Frozen five-second comparison window with its peak-to-peak readout, like the
 * lesson flow's frozen strips.
 */
export function FrozenStrip({
  label,
  sublabel,
  snapshot,
  colors,
  scale,
  blinking,
  ratio,
}: {
  label: string;
  sublabel: string;
  snapshot: EEGSnapshot;
  colors: string[];
  scale: number;
  blinking?: boolean;
  ratio?: number;
}) {
  return (
    <section
      className={cn(
        'flex flex-none flex-col gap-[6px] rounded-lg border bg-white px-[18px] py-[12px]',
        blinking ? 'border-2 border-accent' : 'border-gray-200'
      )}
    >
      <div className="flex items-center justify-between gap-[12px] text-[13px] text-ink-muted">
        <span className={stepLabel}>{label}</span>
        <span>{sublabel}</span>
      </div>
      <div className="flex items-center gap-[12px]">
        <div className="min-w-0 flex-1">
          <SnapshotPlot
            snapshot={snapshot}
            colors={colors}
            amplitudeScale={scale}
            width={640}
            height={150}
          />
        </div>
        <div className="flex w-[130px] flex-none items-center gap-[10px]">
          <div
            aria-hidden
            className={cn(
              'w-[9px] flex-none rounded-r border border-l-0',
              blinking ? 'border-accent' : 'border-signal-great'
            )}
            style={{
              height: Math.max(1, (snapshot.peakToPeak / (2 * scale)) * 96),
            }}
          />
          <div>
            <div className="text-[18px] text-ink">
              {snapshot.peakToPeak.toFixed(0)} µV
            </div>
            <div className="text-[12px] text-ink-muted">
              {blinking && ratio !== undefined
                ? `${Math.round(ratio)}× the still signal`
                : 'peak to peak'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Visible 3–2–1 countdown; pulses only when motion is allowed. */
export function Countdown({ value }: { value: 3 | 2 | 1 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-[28px]"
    >
      {([3, 2, 1] as const).map((digit) => {
        const state =
          digit > value ? 'done' : digit === value ? 'active' : 'ahead';
        return (
          <span
            key={digit}
            className={cn(
              'flex h-[84px] w-[84px] items-center justify-center rounded-full text-[48px] font-light',
              state === 'active' && 'explore-countdown-active text-ink',
              state === 'done' && 'bg-accent text-ink',
              state === 'ahead' && 'border border-gray-200 text-ink-faint'
            )}
          >
            {digit}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The review view: an eyes-open segment above an eyes-closed segment of equal
 * length, both on one µV scale so the change is directly comparable. `compact`
 * renders the same picture small for the `Example` card.
 */
export function SegmentComparison({
  open,
  closed,
  colors,
  scale,
  compact,
}: {
  open: EEGSnapshot;
  closed: EEGSnapshot;
  colors: string[];
  scale: number;
  compact?: boolean;
}) {
  const duration = `${Math.round((open.endTime - open.startTime) / 1000)} SECONDS`;
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        compact ? 'gap-[4px]' : 'gap-[10px]'
      )}
    >
      {(
        [
          { snapshot: open, label: 'EYES OPEN' },
          { snapshot: closed, label: 'EYES CLOSED' },
        ] as const
      ).map(({ snapshot, label }) => (
        <div key={label} className="flex min-h-0 flex-1 flex-col">
          <div className={cn('m-0 flex-none', stepLabel)}>
            {label} · {duration}
          </div>
          <div className="min-h-0 flex-1">
            <SnapshotPlot
              snapshot={snapshot}
              colors={colors}
              amplitudeScale={scale}
              width={compact ? 276 : 860}
              height={compact ? 50 : 236}
              showAxis={!compact}
              tight={compact}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const QUIZ_OPTIONS = [
  { value: 'hump', text: 'A big, slow hump' },
  { value: 'flat', text: 'Not much change' },
] as const;

/**
 * Prediction options styled as radios (not actions); choosing one immediately
 * reveals the expected answer. Nothing is recorded.
 */
export function PredictionQuiz({
  defaultAnswer,
}: {
  /** Pre-answered state, for the answered-state story. */
  defaultAnswer?: (typeof QUIZ_OPTIONS)[number]['value'];
}) {
  const [answer, setAnswer] = useState<
    (typeof QUIZ_OPTIONS)[number]['value'] | null
  >(defaultAnswer ?? null);
  return (
    <div
      className="flex flex-col gap-[8px]"
      role="radiogroup"
      aria-label="Your prediction"
    >
      <span className={stepLabel}>Your prediction</span>
      <div className="flex flex-col gap-[6px]">
        {QUIZ_OPTIONS.map((option) => {
          const active = answer === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAnswer(option.value)}
              className={cn(
                'flex items-center gap-[10px] rounded-md border-2 px-[12px] py-[8px] text-left text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                active
                  ? 'border-brand bg-brand-light text-ink'
                  : 'border-gray-200 bg-white text-ink-muted hover:border-brand hover:text-ink'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'h-[14px] w-[14px] flex-none rounded-full border-2',
                  active ? 'border-brand bg-brand' : 'border-gray-300'
                )}
              />
              {option.text}
            </button>
          );
        })}
      </div>
      {answer && (
        <div role="status" className="text-[14px] leading-[1.45] text-ink">
          The expected answer is <strong>“a big, slow hump”</strong> — every
          blink drops one onto the two front sensors. Check the plot to see
          yours.
        </div>
      )}
    </div>
  );
}

/**
 * Optional ideal reference. Labelled `Example`, visually separated by a dashed
 * border, and never presented as the expected outcome. Same picture as the
 * review view, just small.
 */
export function AlphaExampleCard() {
  return (
    <section
      aria-label="Example comparison"
      className="flex flex-none flex-col gap-[6px] rounded-lg border-2 border-dashed border-gray-300 px-[14px] py-[10px]"
    >
      <span className={cn('m-0', stepLabel)}>Example</span>
      <SegmentComparison
        compact
        open={OPEN_SEGMENT}
        closed={CLOSED_SEGMENT}
        colors={OPEN_SEGMENT.channels.map((ch) =>
          channelColor(ch, EXPLORE_CHANNELS)
        )}
        scale={REVIEW_SEGMENT_SCALE}
      />
      <p className="m-0 !text-[13px] !tracking-normal leading-[1.45] text-ink-muted">
        {ALPHA_EXAMPLE_CAPTION}
      </p>
    </section>
  );
}

/** An error state that says what to do, with the action beside it. */
export function ErrorBanner({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction(): void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-none items-center justify-between gap-[16px] rounded-lg border-2 border-red-200 bg-white px-[18px] py-[8px]"
    >
      <div className="flex items-start gap-[12px]">
        <span
          aria-hidden
          className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full bg-red-50 text-[16px] font-bold text-red-700"
        >
          !
        </span>
        <div>
          <div className="text-[16px] text-ink">{title}</div>
          <div className="text-[14px] leading-[1.4] text-ink-muted">{body}</div>
        </div>
      </div>
      <Button variant="outline-brand" className="flex-none" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}