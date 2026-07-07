import React, { useEffect, useRef } from 'react';
import type { EpochArraysMeta } from '../../actions';
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
//            epoch 0        epoch 1        epoch 2      ...
//          ┌────────────┬────────────┬────────────┐
//   ch 0   │  ~~~~~~~~   │  ~~~~~~~~   │  ~~~~~~~~   │  channel lane
//          ├────────────┼────────────┼────────────┤
//   ch 1   │  ~~~~~~~~   │  ~~~~~~~~   │  ~~~~~~~~   │
//          ├────────────┼────────────┼────────────┤
//   ch 2   │  ~~~~~~~~   │  ~~~~~~~~   │  ~~~~~~~~   │
//          └────────────┴────────────┴────────────┘
//             epoch 0       epoch 1       epoch 2      (bottom index labels)
//
// Read-only (Phase 0): no pointer handlers, no reject/apply/scroll/scale.
// ---------------------------------------------------------------------------

interface Props {
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
}

// Logical canvas size (scaled up for devicePixelRatio at draw time).
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 320;

// How many epochs we draw in this static preview. Scrolling is Phase 1.
const VISIBLE_EPOCHS = 8;

// Gutter reserved on the left for channel labels (logical px).
const LABEL_GUTTER = 64;
// Gutter reserved at the bottom for epoch index labels (logical px).
const BOTTOM_GUTTER = 20;

export default function EpochReviewer({ epochArrays }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const meta = epochArrays?.meta ?? null;

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
    const { n_epochs, n_channels, n_times, event_codes } = meta;

    const visibleEpochs = Math.min(n_epochs, VISIBLE_EPOCHS);
    const plotWidth = CANVAS_WIDTH - LABEL_GUTTER;
    const plotHeight = CANVAS_HEIGHT - BOTTOM_GUTTER;
    const colWidth = plotWidth / visibleEpochs;
    const laneHeight = plotHeight / n_channels;

    // Deterministic per-condition coloring: position in the sorted unique codes.
    const uniqueSortedCodes = [...new Set(event_codes)].sort((a, b) => a - b);

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
    for (let e = 0; e <= visibleEpochs; e += 1) {
      const x = Math.round(LABEL_GUTTER + e * colWidth) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, plotHeight);
      ctx.stroke();
    }

    const cols = Math.max(1, Math.floor(colWidth));

    for (let e = 0; e < visibleEpochs; e += 1) {
      const colLeft = LABEL_GUTTER + e * colWidth;
      const code = event_codes[e];
      ctx.strokeStyle = cssColorForIndex(
        conditionIndexForCode(code, uniqueSortedCodes)
      );
      ctx.lineWidth = 1;

      for (let ch = 0; ch < n_channels; ch += 1) {
        const laneTop = ch * laneHeight;
        const series = epochChannelSeries(buffer, meta, e, ch);

        // Per-lane y-scaling: map [min, max] of this trace to the lane height
        // (with a small vertical pad so traces don't touch the dividers).
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < series.length; i += 1) {
          const v = series[i];
          if (v < min) {
            min = v;
          }
          if (v > max) {
            max = v;
          }
        }
        const pad = laneHeight * 0.1;
        const usableHeight = laneHeight - 2 * pad;
        const range = max - min || 1;
        const toY = (v: number): number =>
          laneTop + pad + (1 - (v - min) / range) * usableHeight;

        if (n_times > cols) {
          // More samples than pixels: draw a vertical min→max line per column
          // so sharp transients survive downsampling.
          const buckets = downsampleMinMax(series, cols);
          ctx.beginPath();
          for (let c = 0; c < buckets.length; c += 1) {
            const x = colLeft + (c * colWidth) / buckets.length;
            const [lo, hi] = buckets[c];
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
    }
  }, [epochArrays, meta]);

  // Empty state — friendly, brand-styled, student-facing.
  if (!epochArrays || !meta || meta.n_epochs === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-brand/40 bg-white/50 p-4 text-center text-brand">
        Load a dataset to see your epochs here 🧠
      </div>
    );
  }

  const visibleEpochs = Math.min(meta.n_epochs, VISIBLE_EPOCHS);
  const laneHeight = (CANVAS_HEIGHT - BOTTOM_GUTTER) / meta.n_channels;
  const colWidth = (CANVAS_WIDTH - LABEL_GUTTER) / visibleEpochs;

  return (
    <div className="text-left">
      <h4 className="text-brand">Epochs</h4>
      <div
        className="relative rounded-lg border border-gray-200 bg-white"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        />

        {/* Channel labels (left gutter). */}
        {meta.ch_names.map((name, ch) => (
          <div
            key={name}
            className="absolute truncate pr-1 text-right text-[10px] text-gray-500"
            style={{
              left: 0,
              width: LABEL_GUTTER,
              top: ch * laneHeight,
              height: laneHeight,
              lineHeight: `${laneHeight}px`,
            }}
          >
            {name}
          </div>
        ))}

        {/* Epoch index labels (bottom gutter). */}
        {Array.from({ length: visibleEpochs }, (_, e) => (
          <div
            key={e}
            className="absolute text-center text-[10px] text-gray-500"
            style={{
              left: LABEL_GUTTER + e * colWidth,
              width: colWidth,
              top: CANVAS_HEIGHT - BOTTOM_GUTTER,
              height: BOTTOM_GUTTER,
              lineHeight: `${BOTTOM_GUTTER}px`,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      {meta.n_epochs > VISIBLE_EPOCHS && (
        <p className="mt-1 text-xs text-gray-500">
          showing first {VISIBLE_EPOCHS} of {meta.n_epochs} epochs
        </p>
      )}
    </div>
  );
}
