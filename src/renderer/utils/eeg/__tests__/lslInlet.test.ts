/**
 * Tests for the renderer-side LSL inlet driver.
 *
 * The main process is faked through window.electronAPI: a captured
 * onLSLInletData handler lets the test "push" chunked inlet epochs and assert
 * they're reconstructed into per-sample EEGData (with seconds→ms timestamps).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import {
  connectToLSLInlet,
  createRawLSLInletObservable,
  disconnectFromLSLInlet,
} from '../lslInlet';
import type {
  DiscoveredStream,
  LSLInletEpoch,
} from '../../../../shared/lslTypes';
import type { EEGData } from '../../../constants/interfaces';

const stream: DiscoveredStream = {
  uid: 'uid-1',
  name: 'OpenBCI-EEG',
  type: 'EEG',
  channelCount: 2,
  sampleRate: 250,
  sourceId: 'openbci',
};

// Captured renderer-side IPC handlers + spies for the outbound calls.
let inletDataHandler: ((epoch: LSLInletEpoch) => void) | null = null;
let inletDisconnectedHandler: ((p: { uid: string }) => void) | null = null;
const subscribeLSLStream = vi.fn();
const unsubscribeLSLStream = vi.fn();

beforeEach(() => {
  inletDataHandler = null;
  inletDisconnectedHandler = null;
  window.electronAPI = {
    discoverLSLStreams: () => Promise.resolve([stream]),
    subscribeLSLStream,
    unsubscribeLSLStream,
    onLSLInletData: (h: (epoch: LSLInletEpoch) => void) => {
      inletDataHandler = h;
      return () => {
        inletDataHandler = null;
      };
    },
    onLSLInletDisconnected: (h: (p: { uid: string }) => void) => {
      inletDisconnectedHandler = h;
      return () => {
        inletDisconnectedHandler = null;
      };
    },
  } as unknown as typeof window.electronAPI;
});

afterEach(() => {
  disconnectFromLSLInlet();
  vi.clearAllMocks();
});

describe('connectToLSLInlet', () => {
  it('returns DeviceInfo with generated channel labels', () => {
    const info = connectToLSLInlet(stream);
    expect(info).toEqual({
      name: 'OpenBCI-EEG',
      samplingRate: 250,
      channels: ['Ch1', 'Ch2'],
    });
  });
});

describe('createRawLSLInletObservable', () => {
  it('reconstructs chunked inlet epochs into per-sample EEGData (s→ms)', async () => {
    const observable = await createRawLSLInletObservable(stream);
    expect(subscribeLSLStream).toHaveBeenCalledWith('uid-1');

    const collected = firstValueFrom(
      observable.pipe(take(2), toArray())
    ) as Promise<EEGData[]>;

    inletDataHandler?.({
      uid: 'uid-1',
      samples: [
        [1, 2],
        [3, 4],
      ],
      timestamps: [1, 2], // seconds
    });

    expect(await collected).toEqual([
      { data: [1, 2], timestamp: 1000 },
      { data: [3, 4], timestamp: 2000 },
    ]);
  });

  it('ignores epochs addressed to a different stream uid', async () => {
    const observable = await createRawLSLInletObservable(stream);
    const seen: EEGData[] = [];
    const sub = observable.subscribe((d) => seen.push(d));

    inletDataHandler?.({
      uid: 'someone-else',
      samples: [[9, 9]],
      timestamps: [5],
    });

    expect(seen).toHaveLength(0);
    sub.unsubscribe();
  });

  it('completes the stream on a matching disconnect event', async () => {
    const observable = await createRawLSLInletObservable(stream);
    const onComplete = vi.fn();
    observable.subscribe({ complete: onComplete });

    inletDisconnectedHandler?.({ uid: 'uid-1' });

    expect(onComplete).toHaveBeenCalledOnce();
  });
});

describe('disconnectFromLSLInlet', () => {
  it('unsubscribes the active inlet over IPC', async () => {
    await createRawLSLInletObservable(stream);
    disconnectFromLSLInlet();
    expect(unsubscribeLSLStream).toHaveBeenCalledWith('uid-1');
  });
});
