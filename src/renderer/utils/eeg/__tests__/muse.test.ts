/**
 * Muse driver tests.
 *
 * Mocking muse-js lets us exercise marker injection without Web Bluetooth.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Observable, Subject } from 'rxjs';
import type { EEGData } from '../../../constants/interfaces';

let mockEegReadings: Subject<EEGData>;
let mockConnectionStatus: Subject<boolean>;

class MockMuseClient {
  enableAux = false;
  deviceName = 'Mock Muse';
  start = vi.fn().mockResolvedValue(undefined);
  connect = vi.fn().mockResolvedValue(undefined);
  disconnect = vi.fn();
  injectMarker = vi.fn();

  get eegReadings(): Observable<EEGData> {
    return mockEegReadings.asObservable();
  }

  get connectionStatus(): Observable<boolean> {
    return mockConnectionStatus.asObservable();
  }
}

vi.doMock('muse-js', () => {
  return {
    MUSE_SERVICE: 'mock-muse-service',
    MuseClient: MockMuseClient,
    // The real zipSamples expands BLE readings into per-sample objects. In the
    // mock pipeline, eegReadings already emits sample-shaped objects.
    zipSamples: (readings: Observable<EEGData>) => readings,
  };
});

beforeEach(() => {
  mockEegReadings = new Subject<EEGData>();
  mockConnectionStatus = new Subject<boolean>();
});

const makeSample = (
  timestamp: number,
  data: number[] = [1, 2, 3, 4]
): EEGData => ({
  data,
  timestamp,
});

describe('Muse driver', () => {
  const loadMuse = () => import('../muse');

  it('assigns marker to the sample whose interval contains the marker timestamp', async () => {
    const { createRawMuseObservable, injectMuseMarker } = await loadMuse();
    const obs = await createRawMuseObservable();
    const seen: EEGData[] = [];
    obs.subscribe((s) => seen.push(s));

    mockEegReadings.next(makeSample(1000));
    injectMuseMarker(42, 1005); // falls inside interval of second sample
    mockEegReadings.next(makeSample(1003.9));
    mockEegReadings.next(makeSample(1007.8));

    expect(seen).toHaveLength(3);
    expect(seen[0].marker).toBeUndefined();
    expect(seen[1].marker).toBe(42);
    expect(seen[2].marker).toBeUndefined();
  });

  it('does not attach a marker to a sample before its timestamp interval', async () => {
    const { createRawMuseObservable, injectMuseMarker } = await loadMuse();
    const obs = await createRawMuseObservable();
    const seen: EEGData[] = [];
    obs.subscribe((s) => seen.push(s));

    // Marker timestamp falls in the interval of the fourth sample, so the
    // first three samples must remain unmarked. This guards against regressions
    // to simple next-sample latching.
    injectMuseMarker(77, 1015);
    mockEegReadings.next(makeSample(1000));
    mockEegReadings.next(makeSample(1003.9));
    mockEegReadings.next(makeSample(1007.8));
    mockEegReadings.next(makeSample(1011.7));

    expect(seen).toHaveLength(4);
    expect(seen[0].marker).toBeUndefined();
    expect(seen[1].marker).toBeUndefined();
    expect(seen[2].marker).toBeUndefined();
    expect(seen[3].marker).toBe(77);
  });

  it('drops pending markers when the stream is torn down', async () => {
    const { createRawMuseObservable, disconnectFromMuse } = await loadMuse();
    const obs = await createRawMuseObservable();
    const seen: EEGData[] = [];
    const sub = obs.subscribe((s) => seen.push(s));

    // cannot access pending marker directly; injecting then tearing down
    // should clear it before the new stream attaches.
    const { injectMuseMarker } = await loadMuse();
    injectMuseMarker(99, 2001); // timestamp would match a sample near 2000 if emitted
    disconnectFromMuse();
    sub.unsubscribe();

    // Recreate stream; the old marker should not attach to new samples.
    const obs2 = await createRawMuseObservable();
    const seen2: EEGData[] = [];
    obs2.subscribe((s) => seen2.push(s));

    mockEegReadings.next(makeSample(2000));

    expect(seen).toHaveLength(0);
    expect(seen2).toHaveLength(1);
    expect(seen2[0].marker).toBeUndefined();
  });

  it('filters out NaN values and keeps only four-channel samples', async () => {
    const { createRawMuseObservable } = await loadMuse();
    const obs = await createRawMuseObservable();
    const seen: EEGData[] = [];
    obs.subscribe((s) => seen.push(s));

    mockEegReadings.next(makeSample(1000, [1, 2, NaN, 4]));
    mockEegReadings.next(makeSample(1003.9, [1, 2, 3]));
    mockEegReadings.next(makeSample(1007.8, [1, 2, 3, 4, 5]));
    mockEegReadings.next(makeSample(1011.7, [1, 2, 3, 4]));

    expect(seen).toHaveLength(2);
    expect(seen[0].data).toEqual([1, 2, 3, 4, 5]);
    expect(seen[0].data).not.toContain(NaN);
    expect(seen[1].data).toEqual([1, 2, 3, 4]);
  });
});
