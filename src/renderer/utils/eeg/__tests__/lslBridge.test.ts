/**
 * Tests for the renderer→main LSL bridge.
 *
 * Covers the pure batching transform (per-sample EEGData → batched LSLEpoch)
 * and the liblsl-availability gate that keeps the hot epoch/marker paths from
 * flooding IPC when LSL is unavailable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { from, firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import type { EEGData } from '../../../constants/interfaces';
import type { LSLEpoch } from '../../../../shared/lslTypes';

// A tick long enough for the module-level isLSLAvailable() probe to resolve.
const flushMicrotasks = () => new Promise((r) => setTimeout(r, 0));

const sample = (data: number[], timestamp: number): EEGData => ({
  data,
  timestamp,
});

describe('batchSamplesToEpoch', () => {
  beforeEach(() => {
    vi.resetModules();
    window.electronAPI = {
      isLSLAvailable: () => Promise.resolve(true),
    } as unknown as typeof window.electronAPI;
  });

  it('batches per-sample EEGData into LSLEpochs of batchSize', async () => {
    const { batchSamplesToEpoch } = await import('../lslBridge');
    const source = from([
      sample([1, 2], 10),
      sample([3, 4], 11),
      sample([5, 6], 12),
      sample([7, 8], 13),
    ]);

    const epochs = await firstValueFrom(
      batchSamplesToEpoch(source, 'Muse-1', 'muse', ['a', 'b'], 256, 2).pipe(
        toArray()
      )
    );

    expect(epochs).toHaveLength(2);
    expect(epochs[0]).toEqual<LSLEpoch>({
      deviceId: 'Muse-1',
      deviceType: 'muse',
      samples: [
        [1, 2],
        [3, 4],
      ],
      timestamps: [10, 11],
      channelNames: ['a', 'b'],
      sampleRate: 256,
    });
    expect(epochs[1].samples).toEqual([
      [5, 6],
      [7, 8],
    ]);
  });

  it('drops samples whose channel count does not match channelNames', async () => {
    const { batchSamplesToEpoch } = await import('../lslBridge');
    const source = from([
      sample([1, 2], 10),
      sample([1, 2, 3], 11), // wrong width — must be filtered out
      sample([3, 4], 12),
    ]);

    const epochs = await firstValueFrom(
      batchSamplesToEpoch(source, 'd', 'muse', ['a', 'b'], 256, 2).pipe(
        toArray()
      )
    );

    expect(epochs).toHaveLength(1);
    expect(epochs[0].samples).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});

describe('sendEpoch / sendMarker availability gate', () => {
  afterEach(() => vi.resetModules());

  it('forwards over IPC when liblsl is available', async () => {
    const sendLSLEpoch = vi.fn();
    const sendLSLMarker = vi.fn();
    window.electronAPI = {
      isLSLAvailable: () => Promise.resolve(true),
      sendLSLEpoch,
      sendLSLMarker,
    } as unknown as typeof window.electronAPI;

    const { sendEpoch, sendMarker } = await import('../lslBridge');
    await flushMicrotasks();

    sendEpoch({
      deviceId: 'd',
      deviceType: 'muse',
      samples: [[1]],
      timestamps: [1],
      channelNames: ['a'],
      sampleRate: 256,
    });
    sendMarker({ label: 'go', rendererTimestamp: 1 });

    expect(sendLSLEpoch).toHaveBeenCalledOnce();
    expect(sendLSLMarker).toHaveBeenCalledOnce();
  });

  it('no-ops (no IPC) when liblsl is unavailable', async () => {
    const sendLSLEpoch = vi.fn();
    const sendLSLMarker = vi.fn();
    window.electronAPI = {
      isLSLAvailable: () => Promise.resolve(false),
      sendLSLEpoch,
      sendLSLMarker,
    } as unknown as typeof window.electronAPI;

    const { sendEpoch, sendMarker } = await import('../lslBridge');
    await flushMicrotasks();

    sendEpoch({
      deviceId: 'd',
      deviceType: 'muse',
      samples: [[1]],
      timestamps: [1],
      channelNames: ['a'],
      sampleRate: 256,
    });
    sendMarker({ label: 'go', rendererTimestamp: 1 });

    expect(sendLSLEpoch).not.toHaveBeenCalled();
    expect(sendLSLMarker).not.toHaveBeenCalled();
  });
});
