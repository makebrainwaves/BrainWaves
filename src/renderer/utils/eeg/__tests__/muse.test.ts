/**
 * Muse driver tests.
 *
 * Only the Bluetooth client is mocked: readings go through the real muse-js
 * `zipSamples` and carry the timestamps muse-js itself would compute
 * (`MuseClient.prototype.getTimestamp`), so these tests see the same input the
 * driver sees from a headset.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Observable, Subject } from 'rxjs';
import type * as MuseJs from 'muse-js';
import type { EEGReading } from 'muse-js';
import type { EEGData } from '../../../constants/interfaces';

let mockEegReadings: Subject<EEGReading>;
let mockConnectionStatus: Subject<boolean>;

class MockMuseClient {
  enableAux = false;
  deviceName = 'Mock Muse';
  start = vi.fn().mockResolvedValue(undefined);
  connect = vi.fn().mockResolvedValue(undefined);
  disconnect = vi.fn();
  injectMarker = vi.fn();

  get eegReadings(): Observable<EEGReading> {
    return mockEegReadings.asObservable();
  }

  get connectionStatus(): Observable<boolean> {
    return mockConnectionStatus.asObservable();
  }
}

vi.doMock('muse-js', async (importOriginal) => ({
  ...(await importOriginal<typeof MuseJs>()),
  MuseClient: MockMuseClient,
}));

const SAMPLE_MS = 1000 / 256;
const PACKET_SAMPLES = 12;
const PACKET_MS = PACKET_SAMPLES * SAMPLE_MS;
/** Wall-clock time at which the headset acquires sample 0. */
const T0 = 1_763_000_000_000;

/** muse-js's own per-connection timestamp state (`lastIndex`/`lastTimestamp`). */
let museJsClock: { lastIndex: number | null; lastTimestamp: number | null };
let museJsTimestamp: (index: number) => number;

beforeEach(async () => {
  mockEegReadings = new Subject<EEGReading>();
  mockConnectionStatus = new Subject<boolean>();
  museJsClock = { lastIndex: null, lastTimestamp: null };
  const { MuseClient } = await vi.importActual<typeof MuseJs>('muse-js');
  const { getTimestamp } = MuseClient.prototype as unknown as {
    getTimestamp: (index: number) => number;
  };
  museJsTimestamp = (index) => getTimestamp.call(museJsClock, index);
  vi.useFakeTimers({ toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Delivers packet `p` (raw 16-bit index `index`) at wall time `arrival`, one
 * notification per electrode, as muse-js does. Every sample's value is its
 * global sample number, so a test can tell which acquired sample came out.
 */
const sendPacket = (
  p: number,
  index: number,
  arrival: number,
  electrodes = [0, 1, 2, 3]
) => {
  vi.setSystemTime(arrival);
  const samples = Array.from(
    { length: PACKET_SAMPLES },
    (_, j) => PACKET_SAMPLES * p + j
  );
  electrodes.forEach((electrode) =>
    mockEegReadings.next({
      electrode,
      index,
      samples,
      timestamp: museJsTimestamp(index),
    })
  );
};

/** Park–Miller PRNG, so the simulated jitter is identical on every run. */
const seededRandom = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe('Muse driver', () => {
  const loadMuse = () => import('../muse');

  /**
   * A simulated headset: its crystal runs `ppm` fast, each packet is sent the
   * moment its last sample is acquired and arrives after 0–30 ms of Bluetooth
   * jitter (40 ms for the first packet after a connect or a gap), and the
   * packet index starts 300 packets before its 16-bit wrap. The minimum
   * Bluetooth latency is 0 here: that remainder needs hardware calibration.
   * Errors are measured from 5 s after each start of delivery.
   */
  const simulateMuse = async ({
    minutes,
    ppm = 70e-6,
    stimulusEveryMs = 0,
    delivered = () => true,
  }: {
    minutes: number;
    ppm?: number;
    stimulusEveryMs?: number;
    delivered?: (p: number) => boolean;
  }) => {
    const { createRawMuseObservable, injectMuseMarker } = await loadMuse();
    const stream = await createRawMuseObservable();
    const random = seededRandom(20261118);
    const samplePeriod = SAMPLE_MS / (1 + ppm);
    const acquiredAt = (s: number) => T0 + s * samplePeriod;

    let countErrorsFrom = Infinity;
    let worstSampleErrorMs = 0;
    const markedSamples: number[] = [];
    const sub = stream.subscribe((sample) => {
      const [s] = sample.data;
      if (acquiredAt(s) >= countErrorsFrom) {
        worstSampleErrorMs = Math.max(
          worstSampleErrorMs,
          Math.abs(sample.timestamp - acquiredAt(s))
        );
      }
      if (sample.marker !== undefined) markedSamples.push(s);
    });

    const stimulusSamples: number[] = [];
    let nextStimulus = stimulusEveryMs ? T0 + 10_000 : Infinity;
    let museJsFirstErrorMs: number | null = null;
    let museJsLastErrorMs = 0;
    const packets = Math.round((minutes * 60_000) / PACKET_MS);
    for (let p = 0; p < packets; p += 1) {
      if (!delivered(p)) continue;
      const resumed = p === 0 || !delivered(p - 1);
      if (resumed) countErrorsFrom = acquiredAt(PACKET_SAMPLES * p) + 5000;
      const arrival = Math.floor(
        acquiredAt(PACKET_SAMPLES * p + PACKET_SAMPLES - 1) +
          (resumed ? 40 : random() * 30)
      );
      while (nextStimulus <= arrival) {
        vi.setSystemTime(nextStimulus);
        injectMuseMarker(1, nextStimulus);
        stimulusSamples.push(Math.floor((nextStimulus - T0) / samplePeriod));
        nextStimulus += stimulusEveryMs + Math.floor(random() * 1000);
      }
      const index = (0xffff - 300 + p) & 0xffff;
      sendPacket(p, index, arrival);
      const museJsErrorMs =
        museJsTimestamp(index) - acquiredAt(PACKET_SAMPLES * p);
      museJsFirstErrorMs ??= museJsErrorMs;
      museJsLastErrorMs = museJsErrorMs;
    }
    sub.unsubscribe();

    return {
      worstSampleErrorMs,
      markerSampleErrors: markedSamples.map((s, k) => s - stimulusSamples[k]),
      stimulusCount: stimulusSamples.length,
      museJsDriftMs: museJsLastErrorMs - (museJsFirstErrorMs ?? 0),
    };
  };

  it('times samples by packet arrival, not by muse-js counting from its first packet', async () => {
    const result = await simulateMuse({ minutes: 40, stimulusEveryMs: 2000 });

    // muse-js's own clock drifts by ~170 ms over this run: the field failure.
    expect(result.museJsDriftMs).toBeGreaterThan(150);
    expect(result.worstSampleErrorMs).toBeLessThanOrEqual(SAMPLE_MS);
    expect(result.stimulusCount).toBeGreaterThan(900);
    expect(result.markerSampleErrors).toHaveLength(result.stimulusCount);
    expect(
      result.markerSampleErrors.every((error) => Math.abs(error) <= 1)
    ).toBe(true);
  }, 30_000);

  it('follows a headset whose crystal runs slow', async () => {
    const result = await simulateMuse({ minutes: 20, ppm: -70e-6 });
    expect(result.worstSampleErrorMs).toBeLessThanOrEqual(SAMPLE_MS);
  }, 30_000);

  it('stays on the wall clock after a gap longer than half the packet index range', async () => {
    // Nothing subscribed (or no Bluetooth) for 30 minutes, then streaming again.
    const gap = (p: number) =>
      p * PACKET_MS >= 30_000 && p * PACKET_MS < 1_830_000;
    const result = await simulateMuse({
      minutes: 31,
      delivered: (p) => !gap(p),
    });
    expect(result.worstSampleErrorMs).toBeLessThanOrEqual(SAMPLE_MS);
  }, 30_000);

  it('drops pending markers when the stream is torn down', async () => {
    const { createRawMuseObservable, disconnectFromMuse, injectMuseMarker } =
      await loadMuse();
    const sub = (await createRawMuseObservable()).subscribe();
    injectMuseMarker(99, T0 + 30);
    disconnectFromMuse();
    sub.unsubscribe();

    const seen: EEGData[] = [];
    (await createRawMuseObservable()).subscribe((s) => seen.push(s));
    for (let p = 0; p < 4; p += 1) sendPacket(p, p, T0 + (p + 1) * PACKET_MS);

    expect(seen).toHaveLength(3 * PACKET_SAMPLES);
    expect(seen.every((s) => s.marker === undefined)).toBe(true);
  });

  it('keeps only samples with at least four channels, without NaN gaps', async () => {
    const { createRawMuseObservable } = await loadMuse();
    const seen: EEGData[] = [];
    (await createRawMuseObservable()).subscribe((s) => seen.push(s));

    sendPacket(0, 0, T0, [0, 1, 2]);
    sendPacket(1, 1, T0 + PACKET_MS, [0, 1, 2, 3, 4]);
    sendPacket(2, 2, T0 + 2 * PACKET_MS, [0, 1, 2, 3]);
    sendPacket(3, 3, T0 + 3 * PACKET_MS);

    expect(seen).toHaveLength(2 * PACKET_SAMPLES);
    expect(seen[0].data).toEqual([12, 12, 12, 12, 12]);
    expect(seen[PACKET_SAMPLES].data).toEqual([24, 24, 24, 24]);
  });
});
