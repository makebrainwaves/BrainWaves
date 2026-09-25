import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { EpochArraysMeta } from '../../actions';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import { epochChannelSeries, meanTrace } from '../CleanComponent/epochArrays';

/** Walkthrough steps the chart can draw: trials, their mean, condition means, the ~170 ms window. */
export type ErpChartStep = 1 | 2 | 3 | 4;

interface Props {
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta };
  channel: string;
  codeToLabel: Record<number, string>;
  step: ErpChartStep;
}

/** Dash pattern per condition index, so conditions differ by more than color. */
export const CONDITION_DASH = ['', '7 4', '2 3', '10 3 2 3'];

const M = { left: 52, right: 96, top: 30, bottom: 44 };
const INK = '#1a1a1a';
const MUTED = '#666';
/** Window highlighted in step 4; the face-sensitive N170 usually peaks inside it. */
const N170_WINDOW: [number, number] = [0.13, 0.21];

/** Smallest multiple of `step` that is at least `value`. */
const ceilTo = (value: number, step: number) =>
  Math.max(step, Math.ceil(value / step) * step);

/**
 * Teaching chart for the ERP walkthrough, drawn from the same epoch arrays
 * the worker ships for Clean (`get_epochs_arrays`). Every line is computed
 * here from the buffer: single trials, the grand mean, and one mean per
 * condition (`meanTrace`). Pointers annotate the part each step is about.
 */
export default function ErpTraceChart({
  epochArrays,
  channel,
  codeToLabel,
  step,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { buffer, meta } = epochArrays;
  const ch = meta.ch_names.indexOf(channel);

  const lines = useMemo(() => {
    const all = meta.event_codes.map((_, i) => i);
    const codes = [...new Set(meta.event_codes)].sort((a, b) => a - b);
    return {
      trials: all.map((e) => epochChannelSeries(buffer, meta, e, ch)),
      grandMean: meanTrace(buffer, meta, all, ch),
      conditions: codes.map((code, index) => {
        const epochs = all.filter((e) => meta.event_codes[e] === code);
        return {
          label: codeToLabel[code] ?? `Condition ${code}`,
          count: epochs.length,
          color: cssColorForIndex(index),
          dash: CONDITION_DASH[index % CONDITION_DASH.length],
          mean: meanTrace(buffer, meta, epochs, ch),
        };
      }),
    };
  }, [buffer, meta, ch, codeToLabel]);

  const showTrials = step <= 2;
  const extent = useMemo(() => {
    const series = showTrials ? lines.trials : lines.conditions.map((c) => c.mean);
    let max = 0;
    for (const s of series) for (const v of s) max = Math.max(max, Math.abs(v));
    return showTrials ? ceilTo(max, 10) : ceilTo(max * 1.15, 2);
  }, [lines, showTrials]);

  const { width, height } = size;
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = Math.max(0, height - M.top - M.bottom);
  const t0 = meta.times[0];
  const t1 = meta.times[meta.times.length - 1];
  const x = (t: number) => M.left + ((t - t0) / (t1 - t0)) * plotW;
  const y = (v: number) => M.top + ((extent - v) / (2 * extent)) * plotH;
  const path = (series: ArrayLike<number>) =>
    Array.from(
      series,
      (v, i) => `${i ? 'L' : 'M'}${x(meta.times[i]).toFixed(1)} ${y(v).toFixed(1)}`
    ).join('');

  const face = lines.conditions[0];
  const pointerT = step === 4 ? 0.17 : 0.52;
  const pointerSeries =
    step === 1 ? lines.trials[0] : step === 2 ? lines.grandMean : face.mean;
  const pointer = {
    x: x(pointerT),
    y: y(pointerSeries[meta.times.findIndex((t) => t >= pointerT)]),
    text:
      step === 1
        ? 'This is one trial'
        : step === 2
          ? `The average of all ${lines.trials.length} trials`
          : step === 4
            ? `${face.label} may dip lower here, around 170 ms`
            : '',
  };
  const labelW = pointer.text.length * 6.9 + 16;
  const labelX = Math.min(
    Math.max(M.left + 4, pointer.x + 24),
    M.left + plotW - labelW
  );
  const besidePointer = step === 4;
  const labelY = besidePointer
    ? Math.min(Math.max(M.top + 6, pointer.y - 12), M.top + plotH - 30)
    : pointer.y > M.top + plotH / 2
      ? M.top + 6
      : M.top + plotH - 30;
  const endLabelY: number[] = [];
  let lastLabelY = -Infinity;
  for (const { i, wanted } of lines.conditions
    .map((c, i) => ({ i, wanted: y(c.mean[c.mean.length - 1]) }))
    .sort((a, b) => a.wanted - b.wanted)) {
    lastLabelY = Math.max(wanted, lastLabelY + 16);
    endLabelY[i] = lastLabelY;
  }
  const yTicks = [-extent, -extent / 2, 0, extent / 2, extent];

  return (
    <div ref={box} className="relative min-h-0 flex-1">
      {width > 0 && height > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${channel}: ${
            showTrials
              ? `${lines.trials.length} single trials${step === 2 ? ' and their average' : ''}`
              : lines.conditions.map((c) => `${c.label} average`).join(' and ')
          }, -100 to ${Math.round(t1 * 1000)} ms after the image`}
          className="absolute inset-0 font-sans"
        >
          {step === 4 && (
            <rect
              x={x(N170_WINDOW[0])}
              y={M.top}
              width={x(N170_WINDOW[1]) - x(N170_WINDOW[0])}
              height={plotH}
              fill="#ececf1"
            />
          )}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={M.left}
                x2={M.left + plotW}
                y1={y(v)}
                y2={y(v)}
                stroke={v === 0 ? '#bdbdbd' : '#f0f0f0'}
              />
              <text
                x={M.left - 8}
                y={y(v) + 4}
                textAnchor="end"
                fontSize={12}
                fill={MUTED}
              >
                {v}
              </text>
            </g>
          ))}
          <text x={M.left - 8} y={M.top - 12} textAnchor="end" fontSize={12} fill={MUTED}>
            µV
          </text>
          {[-0.1, 0, 0.2, 0.4, 0.6, 0.8].map((t) => (
            <text
              key={t}
              x={x(t)}
              y={M.top + plotH + 18}
              textAnchor="middle"
              fontSize={12}
              fill={MUTED}
            >
              {Math.round(t * 1000)}
            </text>
          ))}
          <text
            x={M.left + plotW / 2}
            y={M.top + plotH + 38}
            textAnchor="middle"
            fontSize={13}
            fill={MUTED}
          >
            Time after the image appears (ms)
          </text>
          <line x1={x(0)} x2={x(0)} y1={M.top} y2={M.top + plotH} stroke={INK} strokeWidth={1} />
          <text x={x(0) + 6} y={M.top - 12} fontSize={12} fill={INK}>
            Image appears
          </text>

          {showTrials && (
            <path
              d={lines.trials.map(path).join('')}
              fill="none"
              stroke={INK}
              strokeOpacity={step === 1 ? 0.13 : 0.07}
              strokeWidth={1}
            />
          )}
          {step === 1 && (
            <path d={path(lines.trials[0])} fill="none" stroke={INK} strokeWidth={1.75} />
          )}
          {step === 2 && (
            <path d={path(lines.grandMean)} fill="none" stroke={INK} strokeWidth={3} />
          )}
          {!showTrials &&
            lines.conditions.map((c, i) => {
              const end = c.mean[c.mean.length - 1];
              return (
                <g key={c.label}>
                  <path
                    d={path(c.mean)}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={2.5}
                    strokeDasharray={c.dash}
                  />
                  <path
                    d={`M${M.left + plotW} ${y(end)}L${M.left + plotW + 4} ${endLabelY[i]}H${M.left + plotW + 24}`}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={2.5}
                    strokeDasharray={c.dash}
                  />
                  <text
                    x={M.left + plotW + 28}
                    y={endLabelY[i] + 4}
                    fontSize={13}
                    fill={INK}
                  >
                    {c.label}
                  </text>
                </g>
              );
            })}

          {pointer.text && (
            <g>
              <line
                x1={pointer.x}
                y1={pointer.y}
                x2={besidePointer ? labelX : labelX + labelW / 2}
                y2={
                  besidePointer
                    ? labelY + 12
                    : labelY + (labelY < pointer.y ? 24 : 0)
                }
                stroke={INK}
                strokeWidth={1.25}
              />
              <circle cx={pointer.x} cy={pointer.y} r={4} fill="white" stroke={INK} strokeWidth={1.5} />
              <rect
                x={labelX}
                y={labelY}
                width={labelW}
                height={24}
                rx={4}
                fill="white"
                stroke={INK}
              />
              <text x={labelX + 8} y={labelY + 16} fontSize={13} fill={INK}>
                {pointer.text}
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
