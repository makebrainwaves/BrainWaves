/**
 * Integration tests for the main-process LSL managers (outlets + inlets).
 *
 * The native `node-labstreaminglayer` binding is replaced (via the mocked
 * `loadLSL`) with an in-memory fake "LSL network" (see ./fakeLslNetwork), so an
 * outlet pushed by the renderer can be discovered and read back through an
 * inlet without any real liblsl — letting these run on CI on every OS.
 */
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { createFakeLSL, type FakeBroker } from './fakeLslNetwork';
import { loadLSL } from '../native';
import { lslOutlets } from '../outlets';
import { lslInlets } from '../inlets';
import type { LSLEpoch, LSLInletEpoch } from '../../../shared/lslTypes';

vi.mock('../native');
vi.mock('electron-log', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

type NativeModule = ReturnType<typeof loadLSL>;

let broker: FakeBroker;
const mockedLoadLSL = loadLSL as Mock;

const museEpoch = (): LSLEpoch => ({
  deviceId: 'Muse-1234',
  deviceType: 'muse',
  channelNames: ['TP9', 'AF7', 'AF8', 'TP10'],
  sampleRate: 256,
  samples: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
  ],
  // ms (performance.now()) — the outlet must convert these to seconds.
  timestamps: [1000, 2000],
});

beforeEach(() => {
  vi.useFakeTimers();
  const fake = createFakeLSL();
  broker = fake.broker;
  mockedLoadLSL.mockReturnValue(fake.module as unknown as NativeModule);
});

afterEach(() => {
  lslOutlets.destroyAll();
  lslInlets.destroyAll();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('LSL outlet → inlet round trip', () => {
  it('forwards pushed samples through a discovered + subscribed inlet', () => {
    lslOutlets.pushEpoch(museEpoch());

    const discovered = lslInlets.discoverStreams(0);
    expect(discovered).toHaveLength(1);
    expect(discovered[0]).toMatchObject({
      name: 'BrainWaves-muse-Muse-1234',
      type: 'EEG',
      channelCount: 4,
      sampleRate: 256,
    });

    const received: LSLInletEpoch[] = [];
    const ok = lslInlets.subscribeStream(discovered[0].uid, (epoch) =>
      received.push(epoch)
    );
    expect(ok).toBe(true);

    // Drive one poll tick of the inlet's setInterval.
    vi.advanceTimersByTime(20);

    expect(received).toHaveLength(1);
    expect(received[0].samples).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]);
    // ms → s conversion happens on the outlet, so the inlet sees seconds.
    expect(received[0].timestamps).toEqual([1, 2]);
  });

  it('lazily creates an outlet with correct LSL metadata on first push', () => {
    lslOutlets.pushEpoch(museEpoch());

    expect(broker.outlets).toHaveLength(1);
    const { info } = broker.outlets[0];
    expect(info.channelLabels).toEqual(['TP9', 'AF7', 'AF8', 'TP10']);
    expect(info.channelTypesValue).toBe('EEG');
    expect(info.channelUnitsValue).toBe('microvolts');
    expect(info.format).toBe('float32');
    expect(info.sourceId()).toBe('Muse-1234');
  });

  it('converts millisecond timestamps to seconds on pushChunk', () => {
    lslOutlets.pushEpoch(museEpoch());
    expect(broker.outlets[0].pushedChunks[0].timestamps).toEqual([1, 2]);
  });
});

describe('LSL inlet decimation', () => {
  it('strides high-rate streams down before forwarding to the renderer', () => {
    // 1 channel @ 20 kHz = 20000 samples/s > the 16384 renderer cap → stride 2.
    lslOutlets.pushEpoch({
      deviceId: 'fast',
      deviceType: 'muse',
      channelNames: ['x'],
      sampleRate: 20000,
      samples: [[0], [1], [2], [3]],
      timestamps: [1, 2, 3, 4],
    });

    const [stream] = lslInlets.discoverStreams(0);
    const received: LSLInletEpoch[] = [];
    lslInlets.subscribeStream(stream.uid, (e) => received.push(e));
    vi.advanceTimersByTime(20);

    expect(received).toHaveLength(1);
    // Every other sample kept (indices 0 and 2).
    expect(received[0].samples).toEqual([[0], [2]]);
  });
});

describe('LSL marker outlet', () => {
  it('creates a single marker outlet and pushes string samples', () => {
    lslOutlets.pushMarker('stimulus_onset');
    lslOutlets.pushMarker('1');

    const markerOutlets = broker.outlets.filter(
      (o) => o.info.type() === 'Markers'
    );
    expect(markerOutlets).toHaveLength(1);
    expect(markerOutlets[0].pushedSamples).toEqual([['stimulus_onset'], ['1']]);
  });
});

describe('LSL inlet teardown', () => {
  it('disconnects + cleans up when a poll throws mid-stream', () => {
    lslOutlets.pushEpoch(museEpoch());
    const [stream] = lslInlets.discoverStreams(0);
    const onDisconnected = vi.fn();
    lslInlets.subscribeStream(stream.uid, vi.fn(), onDisconnected);

    broker.failInletPulls = true;
    vi.advanceTimersByTime(20);

    expect(onDisconnected).toHaveBeenCalledOnce();
    // Subsequent ticks must not keep firing after teardown.
    vi.advanceTimersByTime(100);
    expect(onDisconnected).toHaveBeenCalledOnce();
  });

  it('frees inlet + outlet handles on destroyAll', () => {
    lslOutlets.pushEpoch(museEpoch());
    const outlet = broker.outlets[0];
    const [stream] = lslInlets.discoverStreams(0);
    lslInlets.subscribeStream(stream.uid, vi.fn());

    lslInlets.destroyAll();
    lslOutlets.destroyAll();

    expect(outlet.destroyed).toBe(true);
  });
});

describe('LSL unavailable (liblsl not loaded)', () => {
  beforeEach(() => mockedLoadLSL.mockReturnValue(null));

  it('no-ops outlet pushes and reports no streams without throwing', () => {
    expect(() => lslOutlets.pushEpoch(museEpoch())).not.toThrow();
    expect(() => lslOutlets.pushMarker('x')).not.toThrow();
    expect(lslInlets.discoverStreams(0)).toEqual([]);
    expect(lslInlets.subscribeStream('nope', vi.fn())).toBe(false);
  });
});
