import React, { ReactNode, useEffect, useId, useRef } from 'react';
import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import { SIGNAL_QUALITY } from '../../constants/constants';
import {
  ELECTRODES,
  QUALITY_LABELS,
  UNKNOWN_ELECTRODE,
} from '../../constants/electrodes';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  ALPHA_EXAMPLE_CAPTION,
  NOISE_DEFINITION,
  NOISE_SETTLING_NOTE,
  QUALITY_SCENARIOS,
  QUALITY_STATE_TONE,
  QualityState,
  SensorStatus,
} from './fixtures';

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

interface FixturePlotProps {
  /** Synthetic stand-in data; the real viewer renders this from the webview. */
  snapshot: EEGSnapshot;
  annotations?: PlotAnnotation[];
  /** Per-channel stroke colors, index-aligned with `snapshot.channels`. */
  colors: string[];
  /** Symmetric µV half-range, like `ViewerComponent.amplitudeScale`. */
  amplitudeScale?: number;
  width?: number;
  height?: number;
}

/**
 * Storybook stand-in for the live `<webview>` plot (`ViewerComponent` /
 * `EEGViewer`, which cannot run outside Electron). Same geometry as the real
 * viewer: 20/10/30/44 margins, channels stacked in equal bands, channel labels
 * on the left, time running left→right with a whole-second offset axis, and
 * annotation bands with pill labels. Drawn from a synthetic fixture series.
 */
export function FixturePlot({
  snapshot,
  annotations = [],
  colors,
  amplitudeScale = 200,
  width = 900,
  height = 420,
}: FixturePlotProps) {
  const clipId = useId();
  const plotW = width - PLOT_MARGIN.left - PLOT_MARGIN.right;
  const plotH = height - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
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
      aria-label="Live EEG trace, four channels stacked over time"
    >
      <g transform={`translate(${PLOT_MARGIN.left},${PLOT_MARGIN.top})`}>
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
        {bands.map(({ annotation, x, width: bandWidth, ended }) => {
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
                      )},${plotH + 6})`}
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
        <clipPath id={clipId}>
          <rect x={0} y={-LABEL_GUTTER} width={plotW} height={plotH + 2 * LABEL_GUTTER} />
        </clipPath>
      </g>
    </svg>
  );
}

/** A plot card: one caption line above a plot that fills the given space. */
export function PlotCard({
  caption,
  aside,
  children,
  className,
}: {
  caption: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
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
          <span aria-hidden className="h-[8px] w-[8px] rounded-full bg-brand" />
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
  sensors: SensorStatus[];
  className?: string;
}) {
  const scenario = QUALITY_SCENARIOS[state];
  return (
    <section
      aria-label="Signal status"
      className={cn(
        'flex flex-none flex-col gap-[6px] rounded-lg border border-gray-200 bg-white px-[18px] py-[12px]',
        className
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-[14px] gap-y-[2px]">
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
        <span className="text-[14px] leading-[1.4] text-ink-muted">
          {scenario.action}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-[16px] gap-y-[2px] text-[13px] text-ink-muted">
        {sensors.map(({ channel, quality }) => (
          <span key={channel}>
            <strong className="text-ink">{channel}</strong>{' '}
            {QUALITY_LABELS[quality]}
          </span>
        ))}
      </div>
    </section>
  );
}

/**
 * Per-sensor detail as color plus a word plus a fix, so nothing needs color
 * interpretation (same idiom as `SignalPrep`). Variability is not impedance.
 */
export function SensorList({ sensors }: { sensors: SensorStatus[] }) {
  return (
    <section
      aria-label="Sensor detail"
      className="flex flex-none flex-col gap-[8px] rounded-lg border border-gray-200 bg-white px-[16px] py-[12px]"
    >
      <h2 className={cn('m-0', stepLabel)}>Each sensor</h2>
      <ul className="m-0 flex flex-col gap-[8px] p-0">
        {sensors.map(({ channel, quality }) => {
          const meta = ELECTRODES[channel] ?? UNKNOWN_ELECTRODE;
          return (
            <li key={channel} className="flex items-start gap-[8px]">
              <span
                aria-hidden
                className={cn(
                  'mt-[4px] h-[12px] w-[12px] flex-none rounded-full border-2',
                  {
                    [SIGNAL_QUALITY.GREAT]:
                      'bg-signal-great border-signal-great',
                    [SIGNAL_QUALITY.OK]: 'bg-signal-ok border-signal-ok',
                    [SIGNAL_QUALITY.BAD]: 'bg-signal-bad border-signal-bad',
                    [SIGNAL_QUALITY.DISCONNECTED]:
                      'bg-white border-signal-none',
                  }[quality]
                )}
              />
              <span className="flex flex-col gap-[2px]">
                <span className="text-[14px] text-ink">
                  <strong>{channel}</strong> · {meta.location} —{' '}
                  <strong>{QUALITY_LABELS[quality]}</strong>
                </span>
                <span className="text-[13px] leading-[1.4] text-ink-muted">
                  {meta.fixes[quality]}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
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
  backDisabled,
  nextDisabled,
}: {
  /** Uppercase step counter prefix, e.g. `Where is this noise coming from?`. */
  label: string;
  /** Current step; 0 hides the counter and pips (pre-step screens). */
  step: number;
  steps: number;
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
          {step > 0 && ` · Step ${step} of ${steps}`}
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
        className="explore-step-copy flex min-h-0 flex-1 flex-col gap-[10px]"
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

/** Color legend for the noise demonstration's stable trace colors (§5.2). */
export function TraceLegend({
  channels,
  colors,
}: {
  channels: string[];
  colors: string[];
}) {
  return (
    <div className="flex flex-none flex-wrap items-center gap-x-[14px] gap-y-[2px] text-[13px] text-ink-muted">
      {channels.map((channel, i) => (
        <span key={channel} className="flex items-center gap-[6px]">
          <span
            aria-hidden
            className="h-[3px] w-[16px] rounded-full"
            style={{ background: colors[i] }}
          />
          {channel}
        </span>
      ))}
      <span>— colors stay the same through this lesson</span>
    </div>
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
          <FixturePlot
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
 * Optional ideal alpha reference. Labelled `Example`, visually separated by a
 * dashed border, and never presented as the expected outcome.
 */
export function AlphaExampleCard() {
  return (
    <section
      aria-label="Example alpha comparison"
      className="flex flex-none flex-col gap-[6px] rounded-lg border-2 border-dashed border-gray-300 px-[14px] py-[10px]"
    >
      <span className={cn('m-0', stepLabel)}>Example</span>
      <svg viewBox="0 0 260 100" aria-hidden className="h-[100px] w-full">
        <rect x={20} y={44} width={64} height={34} fill="#bfbfbf" />
        <rect x={150} y={12} width={64} height={66} fill="#666" />
        <text x={52} y={92} textAnchor="middle" fill="#666" style={{ font: AXIS_FONT }}>
          before
        </text>
        <text x={182} y={92} textAnchor="middle" fill="#666" style={{ font: AXIS_FONT }}>
          eyes closed
        </text>
      </svg>
      <p className="m-0 !text-[13px] !tracking-normal leading-[1.45] text-ink-muted">
        What a clear alpha increase can look like. {ALPHA_EXAMPLE_CAPTION}
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
  unsupported,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction(): void;
  /** Unsupported-channel note, when the headset reports unusable channels. */
  unsupported?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-none flex-col gap-[8px] rounded-lg border-2 border-red-200 bg-white px-[18px] py-[12px]"
    >
      <div className="flex items-center justify-between gap-[16px]">
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
      {unsupported && (
        <div className="border-t border-red-100 pt-[8px] text-[14px] leading-[1.45] text-ink-muted">
          {unsupported}
        </div>
      )}
    </div>
  );
}