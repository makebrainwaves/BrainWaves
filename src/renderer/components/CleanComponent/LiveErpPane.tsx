import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EpochArraysMeta } from '../../actions';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import { conditionIndexForCode, meanTrace } from './epochArrays';

// ---------------------------------------------------------------------------
// Live ERP pane — the "watch it clean up" payoff. Averages the INCLUDED epochs
// (all epochs NOT in `rejected`), grouped by condition, and draws one mean line
// per condition for the selected channel. Recomputes instantly whenever the
// student toggles an epoch, so the averaged waveform visibly cleans up.
//
//   Live ERP                          channel: [ Pz ▾ ]
//   ┌──────────────────────────────────────────────┐
//   │              ╱‾‾‾╲                             │
//   │   ‾‾‾╲__╱‾‾‾╱     ╲___  ← one line / condition │
//   │ ─────────┊──────────────────  (zero baseline) │
//   │          0ms                                   │
//   └──────────────────────────────────────────────┘
//   ■ Condition 1 (42)   ■ Condition 2 (39)
//   Averaged over 81 epochs — reject noisy ones to clean it up
// ---------------------------------------------------------------------------

interface Props {
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  // ABSOLUTE epoch indices marked for rejection (excluded from the average).
  rejected: Set<number>;
  // Optional map from numeric event code to a human-readable condition label.
  codeToLabel?: Record<number, string>;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 240;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 12;

export default function LiveErpPane({
  epochArrays,
  rejected,
  codeToLabel,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [channel, setChannel] = useState(0);

  const meta = epochArrays?.meta ?? null;

  // Included epoch indices grouped by condition code. Recomputed whenever the
  // dataset or the rejected set changes.
  const { groups, uniqueSortedCodes, includedCount } = useMemo(() => {
    if (!meta || meta.n_epochs === 0) {
      return {
        groups: new Map<number, number[]>(),
        uniqueSortedCodes: [] as number[],
        includedCount: 0,
      };
    }
    const byCode = new Map<number, number[]>();
    let included = 0;
    for (let i = 0; i < meta.n_epochs; i += 1) {
      if (rejected.has(i)) {
        continue;
      }
      included += 1;
      const code = meta.event_codes[i];
      const list = byCode.get(code);
      if (list) {
        list.push(i);
      } else {
        byCode.set(code, [i]);
      }
    }
    return {
      groups: byCode,
      uniqueSortedCodes: [...new Set(meta.event_codes)].sort((a, b) => a - b),
      includedCount: included,
    };
  }, [meta, rejected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !epochArrays || !meta || meta.n_epochs === 0) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { buffer } = epochArrays;
    const { n_times, times } = meta;
    const plotLeft = PAD_LEFT;
    const plotRight = CANVAS_WIDTH - PAD_RIGHT;
    const plotTop = PAD_TOP;
    const plotBottom = CANVAS_HEIGHT - PAD_BOTTOM;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    // Compute one mean trace per condition, tracking a shared Y range so all
    // conditions are drawn on the same amplitude scale.
    const traces: Array<{ code: number; series: Float32Array }> = [];
    let min = Infinity;
    let max = -Infinity;
    for (const code of uniqueSortedCodes) {
      const indices = groups.get(code);
      if (!indices || indices.length === 0) {
        continue;
      }
      const series = meanTrace(buffer, meta, indices, channel);
      for (let t = 0; t < series.length; t += 1) {
        if (series[t] < min) {
          min = series[t];
        }
        if (series[t] > max) {
          max = series[t];
        }
      }
      traces.push({ code, series });
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      min = -1;
      max = 1;
    }
    const range = max - min || 1;
    const yPad = range * 0.1;
    const yLo = min - yPad;
    const yHi = max + yPad;
    const toY = (v: number): number =>
      plotBottom - ((v - yLo) / (yHi - yLo)) * plotHeight;
    const toX = (i: number): number =>
      plotLeft + (n_times <= 1 ? 0 : (i / (n_times - 1)) * plotWidth);

    // Framing.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(plotLeft + 0.5, plotTop + 0.5, plotWidth, plotHeight);

    // Horizontal zero-amplitude baseline (if 0 is inside range).
    if (yLo <= 0 && yHi >= 0) {
      const y = Math.round(toY(0)) + 0.5;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();
    }

    // Vertical stimulus-onset line at t = 0 (where times crosses zero).
    if (times.length === n_times && n_times > 1) {
      let zeroIdx = -1;
      for (let i = 0; i < times.length; i += 1) {
        if (times[i] >= 0) {
          zeroIdx = i;
          break;
        }
      }
      if (zeroIdx >= 0) {
        const x = Math.round(toX(zeroIdx)) + 0.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x, plotTop);
        ctx.lineTo(x, plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // One mean line per condition.
    ctx.lineWidth = 2;
    for (const { code, series } of traces) {
      ctx.strokeStyle = cssColorForIndex(
        conditionIndexForCode(code, uniqueSortedCodes)
      );
      ctx.beginPath();
      for (let i = 0; i < series.length; i += 1) {
        const x = toX(i);
        const y = toY(series[i]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }, [epochArrays, meta, rejected, channel, groups, uniqueSortedCodes]);

  // Empty state — brand-styled, mirrors EpochReviewer's placeholder.
  if (!epochArrays || !meta || meta.n_epochs === 0) {
    return (
      <div className="text-left">
        <h4 className="text-brand">Live ERP</h4>
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-brand/40 bg-white/50 p-4 text-center text-brand">
          Load a dataset to watch the ERP build 📈
        </div>
      </div>
    );
  }

  return (
    <div className="text-left">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-brand">Live ERP</h4>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          channel:
          <select
            className="rounded border border-gray-300 p-1 text-xs"
            value={channel}
            onChange={(e) => setChannel(Number(e.target.value))}
          >
            {meta.ch_names.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="rounded-lg border border-gray-200 bg-white"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        />
      </div>

      {/* Legend: one swatch + condition code + included count. */}
      <div className="mt-2 flex flex-wrap gap-3">
        {uniqueSortedCodes.map((code) => {
          const count = groups.get(code)?.length ?? 0;
          return (
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
              {codeToLabel?.[code] ?? `Condition ${code}`} ({count})
            </span>
          );
        })}
      </div>

      <p className="mt-1 text-xs text-gray-500">
        Averaged over {includedCount} epochs — reject noisy ones to clean it up
      </p>
    </div>
  );
}
