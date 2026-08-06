import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import EpochReviewer from '../EpochReviewer';
import type { EpochArraysMeta } from '../../../actions';

// jsdom does not implement <canvas>.getContext; stub it so the draw effect is a
// no-op (this test exercises the DOM overlay, not the canvas pixels).
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    null as unknown as CanvasRenderingContext2D
  );
});

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
    sfreq: 256,
    times: [-0.1, 0, 0.1, 0.2],
    event_codes: [1, 2, 1],
    drop_log: [[], [], []],
  };
  return { buffer: data.buffer, meta };
}

describe('EpochReviewer', () => {
  it('calls onToggleEpoch with the absolute index when a column overlay is clicked', () => {
    const onToggleEpoch = vi.fn();
    render(
      <EpochReviewer
        epochArrays={makeEpochArrays()}
        rejected={new Set()}
        onToggleEpoch={onToggleEpoch}
      />
    );

    // The overlay for epoch 1 is labelled "Reject epoch 1".
    const target = screen.getByLabelText('Reject epoch 1');
    fireEvent.click(target);

    expect(onToggleEpoch).toHaveBeenCalledTimes(1);
    expect(onToggleEpoch).toHaveBeenCalledWith(1);
  });

  it('labels an already-rejected column as Restore', () => {
    const onToggleEpoch = vi.fn();
    render(
      <EpochReviewer
        epochArrays={makeEpochArrays()}
        rejected={new Set([0])}
        onToggleEpoch={onToggleEpoch}
      />
    );

    expect(screen.getByLabelText('Restore epoch 0')).toBeInTheDocument();
  });
});
