import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import EpochReviewer from '../EpochReviewer';
import type { EpochArraysMeta } from '../../../actions';

// jsdom does not implement <canvas>.getContext; stub it so the draw effect is a
// no-op for the DOM-overlay tests.
function stubCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    null as unknown as CanvasRenderingContext2D
  );
}

/** Stubs the canvas with a 2D context that records each stroked path's y values. */
function recordStrokes(): number[][] {
  const strokes: number[][] = [];
  let ys: number[] = [];
  const ctx = {
    setTransform() {},
    clearRect() {},
    fillRect() {},
    beginPath() {
      ys = [];
    },
    moveTo(_x: number, y: number) {
      ys.push(y);
    },
    lineTo(_x: number, y: number) {
      ys.push(y);
    },
    stroke() {
      strokes.push(ys);
    },
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  return strokes;
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** Two one-channel epochs of a 10 Hz sine: ±5 µV, then ±150 µV. */
function quietAndNoisy(): { buffer: ArrayBuffer; meta: EpochArraysMeta } {
  const nTimes = 64;
  const data = new Float32Array(2 * nTimes);
  for (let i = 0; i < nTimes; i += 1) {
    const wave = Math.sin((2 * Math.PI * 10 * i) / nTimes);
    data[i] = 5 * wave;
    data[nTimes + i] = 150 * wave;
  }
  const meta: EpochArraysMeta = {
    n_epochs: 2,
    n_channels: 1,
    n_times: nTimes,
    ch_names: ['TP9'],
    times: Array.from({ length: nTimes }, (_, i) => i / nTimes),
    event_codes: [1, 1],
  };
  return { buffer: data.buffer, meta };
}

/** Drawn vertical extent (px) of each epoch's trace. */
function drawnHeights(laneMicrovolts?: number): number[] {
  const strokes = recordStrokes();
  render(
    <EpochReviewer
      epochArrays={quietAndNoisy()}
      rejected={new Set()}
      onToggleEpoch={vi.fn()}
      badChannels={new Set()}
      onToggleChannel={vi.fn()}
      laneMicrovolts={laneMicrovolts}
    />
  );
  return strokes
    .filter((ys) => ys.length > 2)
    .map((ys) => Math.max(...ys) - Math.min(...ys));
}

// Minimal 3-epoch / 2-channel / 4-sample dataset. Buffer is C-order
// [epoch][channel][time]; exact values don't matter for the click test.
function makeEpochArrays(): { buffer: ArrayBuffer; meta: EpochArraysMeta } {
  const nEpochs = 3;
  const nChannels = 2;
  const nTimes = 4;
  const data = new Float32Array(nEpochs * nChannels * nTimes);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.sin(i);
  }
  const meta: EpochArraysMeta = {
    n_epochs: nEpochs,
    n_channels: nChannels,
    n_times: nTimes,
    ch_names: ['Fp1', 'Fp2'],
    times: [-0.1, 0, 0.1, 0.2],
    event_codes: [1, 2, 1],
  };
  return { buffer: data.buffer, meta };
}

describe('EpochReviewer', () => {
  it('draws a quiet trial shorter than a noisy one on the shared scale', () => {
    const [quiet, noisy] = drawnHeights();
    expect(quiet).toBeLessThan(noisy / 5);
  });

  it('rescales every trace when the lane span changes', () => {
    const [quietAt100] = drawnHeights(100);
    const [quietAt20] = drawnHeights(20);
    expect(quietAt20).toBeCloseTo(quietAt100 * 5, 1);
    expect(screen.getByText('lane = 20 µV')).toBeInTheDocument();
  });

  it('calls onToggleEpoch with the absolute index when a column overlay is clicked', () => {
    stubCanvas();
    const onToggleEpoch = vi.fn();
    render(
      <EpochReviewer
        epochArrays={makeEpochArrays()}
        rejected={new Set()}
        onToggleEpoch={onToggleEpoch}
        badChannels={new Set()}
        onToggleChannel={vi.fn()}
      />
    );

    const target = screen.getByLabelText('Reject trial 1');
    fireEvent.click(target);

    expect(onToggleEpoch).toHaveBeenCalledTimes(1);
    expect(onToggleEpoch).toHaveBeenCalledWith(1);
  });

  it('labels an already-rejected column as Restore', () => {
    stubCanvas();
    const onToggleEpoch = vi.fn();
    render(
      <EpochReviewer
        epochArrays={makeEpochArrays()}
        rejected={new Set([0])}
        onToggleEpoch={onToggleEpoch}
        badChannels={new Set()}
        onToggleChannel={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Restore trial 0')).toBeInTheDocument();
  });
});
