import React, { useEffect, useRef, useState } from 'react';
import type { EpochArraysMeta } from '../../actions';
import { Button } from '../ui/button';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import {
  conditionIndexForCode,
  downsampleMinMax,
  epochChannelSeries,
} from './epochArrays';

// ---------------------------------------------------------------------------
// Canvas layout (matches MNE's epochs.plot): epochs run ACROSS (x), channels
// are STACKED vertically (y). One trace per (epoch, channel) cell.
//
//   [◀ Prev] [Next ▶]              [amp －] [amp ＋]
//            epoch 0        epoch 1        epoch 2      ...
//          ┌────────────┬────────────┬────────────┐
//   ch 0   │  ~~~~~~~~   │ ░░grey░░✕░░ │  ~~~~~~~~   │  channel lane
//          ├────────────┼────────────┼────────────┤    (rejected column
//   ch 1   │  ~~~~~~~~   │ ░░░░░░░░░░ │  ~~~~~~~~   │     is greyed out)
//          ├────────────┼────────────┼────────────┤
//   ch 2   │  ~~~~~~~~   │ ░░░░░░░░░░ │  ~~~~~~~~   │
//          └────────────┴────────────┴────────────┘
//             epoch 0       epoch 1       epoch 2      (bottom index labels)
//
// Interactive (Phase 1): a transparent DOM overlay div per visible column makes
// each epoch click-to-reject (rejected epochs grey out); Prev/Next page through
// all epochs; amp ＋/－ scale trace amplitude. Rendering stays Canvas 2D + a DOM
// overlay for labels/hit-targets (no canvas hit-testing).
//
// Interactive (Phase 2): channel labels in the left gutter are click-to-flag
// bad-channel toggles — a flagged channel's LANE is washed translucent red
// across ALL epoch columns (and its label renders struck-through/red) so bad
// channels read at a glance. An optional condition legend maps numeric event
// codes to human-readable labels via `codeToLabel`.
// ---------------------------------------------------------------------------

interface Props {
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  // ABSOLUTE epoch indices the student has marked for rejection.
  rejected: Set<number>;
  // Toggle a single ABSOLUTE epoch index in/out of the rejected set.
  onToggleEpoch: (index: number) => void;
  // Channel names the student has flagged as "bad" (controlled by the parent).
  badChannels: Set<string>;
  // Toggle a single channel name in/out of the bad-channel set.
  onToggleChannel: (name: string) => void;
  // Optional map from numeric event code to a human-readable condition label.
  codeToLabel?: Record<number, string>;
}

// Logical canvas size (scaled up for devicePixelRatio at draw time).
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 320;

// How many epochs we draw per page. Prev/Next pages by this amount.
const VISIBLE_EPOCHS = 8;

// Gutter reserved on the left for channel labels (logical px).
const LABEL_GUTTER = 64;
// Gutter reserved at the bottom for epoch index labels (logical px).
const BOTTOM_GUTTER = 20;

// Amplitude gain bounds and step (buttons multiply/divide by GAIN_STEP).
const GAIN_STEP = 1.5;
const GAIN_MIN = 0.1;
const GAIN_MAX = 20;

const REJECTED_TRACE_COLOR = 'rgba(120, 120, 120, 0.5)';
const REJECTED_FILL_COLOR = 'rgba(120, 120, 120, 0.15)';
// Translucent wash over a flagged bad channel's lane (drawn across all epochs).
const BAD_CHANNEL_FILL_COLOR = 'rgba(200, 60, 60, 0.10)';

export default function EpochReviewer({
  epochArrays,
  rejected,
  onToggleEpoch,
  badChannels,
  onToggleChannel,
  codeToLabel,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // First epoch of the current page (absolute index).
  const [startEpoch, setStartEpoch] = useState(0);
  // Amplitude magnification applied around each lane's mean.
  const [gain, setGain] = useState(1);

  const meta = epochArrays?.meta ?? null;

  // Page size is constant so column widths stay stable across pages.
  const perPage = meta
    ? Math.min(meta.n_epochs, VISIBLE_EPOCHS)
    : VISIBLE_EPOCHS;
  const maxStart = meta ? Math.max(0, meta.n_epochs - perPage) : 0;
  const clampedStart = Math.min(startEpoch, maxStart);
  const visibleCount = meta
    ? Math.min(perPage, meta.n_epochs - clampedStart)
    : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !epochArrays || !meta || meta.n_epochs === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Scale the backing store for crisp lines on HiDPI displays, but keep
    // drawing in logical coordinates.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { buffer } = epochArrays;
    const { n_epochs, n_channels, n_times, event_codes, ch_names } = meta;

    const plotWidth = CANVAS_WIDTH - LABEL_GUTTER;
    const plotHeight = CANVAS_HEIGHT - BOTTOM_GUTTER;
    const colWidth = plotWidth / perPage;
    const laneHeight = plotHeight / n_channels;
    const count = Math.min(perPage, n_epochs - clampedStart);

    // Deterministic per-condition coloring: position in the sorted unique codes.
    const uniqueSortedCodes = [...new Set(event_codes)].sort((a, b) => a - b);

    // Translucent grey wash over rejected columns (drawn first, under traces).
    for (let c = 0; c < count; c += 1) {
      const absolute = clampedStart + c;
      if (rejected.has(absolute)) {
        ctx.fillStyle = REJECTED_FILL_COLOR;
        ctx.fillRect(LABEL_GUTTER + c * colWidth, 0, colWidth, plotHeight);
      }
    }

    // Translucent red wash over flagged bad-channel lanes — spans every epoch
    // column (drawn under traces) so bad channels read at a glance.
    for (let ch = 0; ch < n_channels; ch += 1) {
      if (badChannels.has(ch_names[ch])) {
        ctx.fillStyle = BAD_CHANNEL_FILL_COLOR;
        ctx.fillRect(
          LABEL_GUTTER,
          ch * laneHeight,
          CANVAS_WIDTH - LABEL_GUTTER,
          laneHeight
        );
      }
    }

    // Faint lane dividers (channels).
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let ch = 1; ch < n_channels; ch += 1) {
      const y = Math.round(ch * laneHeight) + 0.5;
      ctx.beginPath();
      ctx.moveTo(LABEL_GUTTER, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Vertical dividers between epochs.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    for (let e = 0; e <= count; e += 1) {
      const x = Math.round(LABEL_GUTTER + e * colWidth) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, plotHeight);
      ctx.stroke();
    }

    const cols = Math.max(1, Math.floor(colWidth));

    for (let c = 0; c < count; c += 1) {
      const absolute = clampedStart + c;
      const colLeft = LABEL_GUTTER + c * colWidth;
      const isRejected = rejected.has(absolute);
      const code = event_codes[absolute];
      const traceColor = isRejected
        ? REJECTED_TRACE_COLOR
        : cssColorForIndex(conditionIndexForCode(code, uniqueSortedCodes));
      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 1;

      for (let ch = 0; ch < n_channels; ch += 1) {
        const laneTop = ch * laneHeight;
        const laneCenter = laneTop + laneHeight / 2;
        const series = epochChannelSeries(buffer, meta, absolute, ch);

        // Per-lane scaling centered on the trace's mean: at gain=1 the full
        // [min, max] range fills the lane; gain>1 magnifies the deviation from
        // the mean. y is clamped to the lane so magnified traces don't bleed
        // into neighboring channels.
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let i = 0; i < series.length; i += 1) {
          const v = series[i];
          if (v < min) {
            min = v;
          }
          if (v > max) {
            max = v;
          }
          sum += v;
        }
        const mean = series.length > 0 ? sum / series.length : 0;
        const pad = laneHeight * 0.1;
        const usableHeight = laneHeight - 2 * pad;
        const range = max - min || 1;
        const scale = (usableHeight / range) * gain;
        const laneLo = laneTop + pad;
        const laneHi = laneTop + laneHeight - pad;
        const toY = (v: number): number => {
          const y = laneCenter - (v - mean) * scale;
          return y < laneLo ? laneLo : y > laneHi ? laneHi : y;
        };

        if (n_times > cols) {
          // More samples than pixels: draw a vertical min→max line per column
          // so sharp transients survive downsampling.
          const buckets = downsampleMinMax(series, cols);
          ctx.beginPath();
          for (let col = 0; col < buckets.length; col += 1) {
            const x = colLeft + (col * colWidth) / buckets.length;
            const [lo, hi] = buckets[col];
            ctx.moveTo(x, toY(hi));
            ctx.lineTo(x, toY(lo));
          }
          ctx.stroke();
        } else {
          // Fewer samples than pixels: a normal polyline reads best.
          ctx.beginPath();
          for (let i = 0; i < series.length; i += 1) {
            const x =
              colLeft +
              (series.length <= 1 ? 0 : (i / (series.length - 1)) * colWidth);
            const y = toY(series[i]);
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }

      // Bold ✕ over rejected columns so the rejection reads at a glance.
      if (isRejected) {
        ctx.strokeStyle = 'rgba(90, 90, 90, 0.8)';
        ctx.lineWidth = 2;
        const inset = Math.min(colWidth, plotHeight) * 0.18;
        const x0 = colLeft + inset;
        const x1 = colLeft + colWidth - inset;
        const y0 = inset;
        const y1 = plotHeight - inset;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.moveTo(x1, y0);
        ctx.lineTo(x0, y1);
        ctx.stroke();
      }
    }
  }, [epochArrays, meta, rejected, clampedStart, perPage, gain, badChannels]);

  // Empty state — friendly, brand-styled, student-facing.
  if (!epochArrays || !meta || meta.n_epochs === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-brand/40 bg-white/50 p-4 text-center text-brand">
        Load a dataset to see your epochs here 🧠
      </div>
    );
  }

  const laneHeight = (CANVAS_HEIGHT - BOTTOM_GUTTER) / meta.n_channels;
  const colWidth = (CANVAS_WIDTH - LABEL_GUTTER) / perPage;
  const plotHeight = CANVAS_HEIGHT - BOTTOM_GUTTER;
  const firstShown = clampedStart + 1;
  const lastShown = clampedStart + visibleCount;

  // Unique condition codes (sorted) for the legend — mirrors the canvas draw's
  // deterministic per-condition coloring.
  const uniqueSortedCodes = [...new Set(meta.event_codes)].sort(
    (a, b) => a - b
  );

  return (
    <div className="text-left">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-brand">Epochs</h4>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={clampedStart <= 0}
            onClick={() => setStartEpoch(Math.max(0, clampedStart - perPage))}
          >
            ◀ Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={clampedStart >= maxStart}
            onClick={() =>
              setStartEpoch(Math.min(maxStart, clampedStart + perPage))
            }
          >
            Next ▶
          </Button>
          <span className="mx-1 h-4 w-px bg-gray-300" />
          <Button
            variant="outline"
            size="sm"
            aria-label="Decrease amplitude"
            disabled={gain <= GAIN_MIN}
            onClick={() => setGain((g) => Math.max(GAIN_MIN, g / GAIN_STEP))}
          >
            amp －
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Increase amplitude"
            disabled={gain >= GAIN_MAX}
            onClick={() => setGain((g) => Math.min(GAIN_MAX, g * GAIN_STEP))}
          >
            amp ＋
          </Button>
        </div>
      </div>

      <div
        className="relative rounded-lg border border-gray-200 bg-white"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        />

        {/* Channel labels (left gutter) double as click-to-flag bad-channel
            toggles. A flagged channel renders struck-through + red and its lane
            is washed red across every epoch column (see canvas draw). */}
        {meta.ch_names.map((name, ch) => {
          const isBad = badChannels.has(name);
          return (
            <div
              key={name}
              role="button"
              tabIndex={0}
              aria-pressed={isBad}
              aria-label={`${isBad ? 'Unflag' : 'Flag'} channel ${name} as bad`}
              title={`${isBad ? 'Unflag' : 'Flag'} channel ${name} as bad`}
              className={`absolute cursor-pointer truncate pr-1 text-right text-[10px] ${
                isBad ? 'text-red-500 line-through' : 'text-gray-500'
              }`}
              style={{
                left: 0,
                width: LABEL_GUTTER,
                top: ch * laneHeight,
                height: laneHeight,
                lineHeight: `${laneHeight}px`,
              }}
              onClick={() => onToggleChannel(name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleChannel(name);
                }
              }}
            >
              {name}
            </div>
          );
        })}

        {/* Transparent click targets — one per visible epoch column. Clicking
            toggles that ABSOLUTE epoch index in/out of the rejected set. */}
        {Array.from({ length: visibleCount }, (_, c) => {
          const absolute = clampedStart + c;
          const isRejected = rejected.has(absolute);
          return (
            <div
              key={absolute}
              role="button"
              tabIndex={0}
              aria-pressed={isRejected}
              aria-label={`${isRejected ? 'Restore' : 'Reject'} epoch ${absolute}`}
              title={`${isRejected ? 'Restore' : 'Reject'} epoch ${absolute}`}
              className="absolute cursor-pointer"
              style={{
                left: LABEL_GUTTER + c * colWidth,
                width: colWidth,
                top: 0,
                height: plotHeight,
              }}
              onClick={() => onToggleEpoch(absolute)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleEpoch(absolute);
                }
              }}
            />
          );
        })}

        {/* Epoch index labels (bottom gutter) — ABSOLUTE indices. */}
        {Array.from({ length: visibleCount }, (_, c) => {
          const absolute = clampedStart + c;
          return (
            <div
              key={absolute}
              className="absolute text-center text-[10px] text-gray-500"
              style={{
                left: LABEL_GUTTER + c * colWidth,
                width: colWidth,
                top: CANVAS_HEIGHT - BOTTOM_GUTTER,
                height: BOTTOM_GUTTER,
                lineHeight: `${BOTTOM_GUTTER}px`,
              }}
            >
              {absolute}
            </div>
          );
        })}
      </div>

      {/* Condition legend: one swatch + human-readable label per unique code. */}
      {uniqueSortedCodes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3">
          {uniqueSortedCodes.map((code) => (
            <span
              key={code}
              className="flex items-center gap-1 text-xs text-gray-600"
            >
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: cssColorForIndex(
                    conditionIndexForCode(code, uniqueSortedCodes)
                  ),
                }}
              />
              {codeToLabel?.[code] ?? `Condition ${code}`}
            </span>
          ))}
        </div>
      )}

      <p className="mt-1 text-xs text-gray-500">
        showing {firstShown}–{lastShown} of {meta.n_epochs} epochs
        {rejected.size > 0 && ` · ${rejected.size} marked for rejection`}
      </p>
    </div>
  );
}
