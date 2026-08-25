/**
 * Fixture driver tests.
 *
 * Covers the replay loop, marker injection, CSV parsing, and lifecycle
 * (connect / disconnect / cancelScan).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { EEGData } from '../../../constants/interfaces';
import {
  getFixture,
  connectToFixture,
  disconnectFromFixture,
  cancelFixtureScan,
  createRawFixtureObservable,
  injectFixtureMarker,
  fixtureDisconnect$,
} from '../fixture';

// Mock CSV: 256 rows, 4 channels. Row i has data [i, i+1, i+2, i+3].
// Row 128 has baked-in marker 1; all others have no marker.
vi.mock('../fixture_data.csv?raw', () => {
  const header = 'timestamp_ms,TP9,AF7,AF8,TP10,marker';
  const rows: string[] = [];
  for (let i = 0; i < 256; i++) {
    const ts = ((i * 1000) / 256).toFixed(2);
    const marker = i === 128 ? '1' : '';
    rows.push(`${ts},${i},${i + 1},${i + 2},${i + 3},${marker}`);
  }
  return { default: [header, ...rows].join('\n') };
});

describe('fixture driver', () => {
  afterEach(() => {
    vi.useRealTimers();
    disconnectFromFixture();
  });

  // -----------------------------------------------------------------------
  // Lifecycle (no timers needed)
  // -----------------------------------------------------------------------

  it('scan returns a single synthetic device', async () => {
    const devices = await getFixture();
    expect(devices).toHaveLength(1);
    expect(devices[0].name).toBe('Fixture (Synthetic EEG)');
    expect(devices[0].id).toBe('fixture-synthetic-eeg');
  });

  it('connect returns DeviceInfo with 4 channels at 256 Hz', async () => {
    const info = await connectToFixture({ id: 'x', name: 'x' });
    expect(info).not.toBeNull();
    expect(info!.samplingRate).toBe(256);
    expect(info!.channels).toEqual(['TP9', 'AF7', 'AF8', 'TP10']);
  });

  it('cancelScan is a no-op', () => {
    expect(() => cancelFixtureScan()).not.toThrow();
  });

  it('disconnect cleans up the active interval', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const sub = obs.subscribe(() => {});
    expect(sub.closed).toBe(false);
    disconnectFromFixture();
    expect(sub.closed).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Replay
  // -----------------------------------------------------------------------

  it('emits samples with correct channel count', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    vi.advanceTimersToNextTimer(); // sample 0
    vi.advanceTimersToNextTimer(); // sample 1
    vi.advanceTimersToNextTimer(); // sample 2

    expect(seen).toHaveLength(3);
    for (const s of seen) {
      expect(s.data).toHaveLength(4);
      expect(typeof s.timestamp).toBe('number');
    }
  });

  it('emits samples with increasing timestamps', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    for (let i = 0; i < 10; i++) vi.advanceTimersToNextTimer();

    expect(seen).toHaveLength(10);
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i].timestamp).toBeGreaterThan(seen[i - 1].timestamp);
    }
  });
  it('timestamps are monotonically increasing across the CSV loop boundary', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    // CSV has 256 rows — advance past the boundary (samples 0..260).
    for (let i = 0; i < 260; i++) vi.advanceTimersToNextTimer();

    expect(seen).toHaveLength(260);
    // Every timestamp must be strictly greater than the previous one.
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i].timestamp).toBeGreaterThan(seen[i - 1].timestamp);
    }
    // Sample 256 (first sample of the loop) must have a timestamp after sample 255.
    expect(seen[256].timestamp).toBeGreaterThan(seen[255].timestamp);
    // Sample-data arrays must be distinct objects per emission (not shared reference).
    // Values are equal (same row replayed) but references must differ.
    expect(seen[256].data).not.toBe(seen[0].data);
    expect(seen[256].data).toEqual(seen[0].data);
  });

  // -----------------------------------------------------------------------
  // Markers
  // -----------------------------------------------------------------------

  it('injectFixtureMarker attaches the code to the next emission', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    for (let i = 0; i < 5; i++) vi.advanceTimersToNextTimer(); // 5 samples
    injectFixtureMarker(42, Date.now());
    for (let i = 0; i < 5; i++) vi.advanceTimersToNextTimer(); // 5 more

    const hit = seen.find((s) => s.marker === 42);
    expect(hit).toBeDefined();
    expect(seen.filter((s) => s.marker === 42)).toHaveLength(1);
  });

  it('emits baked-in CSV marker at row 128', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    for (let i = 0; i < 200; i++) vi.advanceTimersToNextTimer();

    const row128 = seen.find((s) => s.data[0] === 128);
    expect(row128).toBeDefined();
    expect(row128!.marker).toBe(1);
  });

  it('pending marker shadows baked-in CSV marker on the same row', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));

    // Advance to just before row 128.
    for (let i = 0; i < 128; i++) vi.advanceTimersToNextTimer();
    // Inject marker 99 before row 128 fires.
    injectFixtureMarker(99, Date.now());
    vi.advanceTimersToNextTimer(); // row 128

    // Row 128 should carry the injected code 99, not the baked-in 1.
    const row128 = seen.find((s) => s.data[0] === 128);
    expect(row128).toBeDefined();
    expect(row128!.marker).toBe(99);
    // No sample should carry the baked-in marker 1.
    expect(seen.find((s) => s.marker === 1)).toBeUndefined();
  });

  it('injectMarker before stream starts does not leak into first sample', async () => {
    vi.useFakeTimers();
    injectFixtureMarker(77, 0);
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    vi.advanceTimersToNextTimer(); // sample 0

    expect(seen[0].marker).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  it('disconnect$ never emits', () => {
    const emitted: void[] = [];
    const sub = fixtureDisconnect$().subscribe({ next: () => emitted.push() });
    expect(emitted).toHaveLength(0);
    sub.unsubscribe();
  });
});