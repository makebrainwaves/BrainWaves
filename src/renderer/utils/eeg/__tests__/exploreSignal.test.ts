import { describe, expect, it } from 'vitest';
import { SIGNAL_QUALITY } from '../../../constants/constants';
import type { SignalQualityData } from '../../../constants/interfaces';
import { ExploreSession } from '../exploreSignal';

const channels = ['TP9', 'AF7', 'AF8', 'TP10'];
const rate = 256;
const origin = 1700000000000;
const calm = (time: number) => 4 * Math.sin(2 * Math.PI * 7 * time);

function chunk(
  start: number,
  duration: number,
  signal: (time: number, channel: number) => number = (t) => calm(t),
  quality = SIGNAL_QUALITY.GREAT
): SignalQualityData {
  return {
    data: channels.map((_, channel) =>
      Array.from({ length: Math.round(duration * rate) }, (_, sample) =>
        signal(start + sample / rate, channel)
      )
    ),
    info: {
      startTime: origin + start * 1000,
      samplingRate: rate,
      channelNames: channels,
      signalQuality: Object.fromEntries(
        channels.map((name) => [name, 1])
      ) as Record<string, number>,
    },
    signalQuality: Object.fromEntries(
      channels.map((name) => [name, quality])
    ) as Record<string, SIGNAL_QUALITY>,
  };
}

describe('ExploreSession', () => {
  it('measures a posterior alpha rise against the preceding five seconds', () => {
    const session = new ExploreSession(channels, rate);
    // Posterior channels carry a little resting alpha; eyes closed at t=7s
    // makes it ten times taller, which is a hundredfold in power.
    const posterior = (time: number, channel: number) =>
      calm(time) +
      (channel === 0 || channel === 3
        ? (time >= 7 ? 30 : 3) * Math.sin(2 * Math.PI * 10 * time)
        : 0);
    session.consume(chunk(0, 12, posterior));
    const ratio = session.alphaRatio(origin + 7000, origin + 12000);
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThan(20);
    expect(session.alphaRatio(origin + 6000, origin + 7000)!).toBeLessThan(2);
  });

  it('returns an empty comparison and no alpha when there are no clear events', () => {
    const session = new ExploreSession(channels, rate);
    session.consume(chunk(0, 5));
    expect(session.status().blinkEvents).toEqual([]);
    expect(session.comparison()).toBeNull();
    expect(
      session.alphaRatio(
        session.status().latestTime! - 5000,
        session.status().latestTime!
      )
    ).toBeNull();
  });

  it('resets cleanly and refuses discontinuous or nonfinite data', () => {
    const session = new ExploreSession(channels, rate);
    session.consume(chunk(0, 4));
    session.reset();
    expect(session.status().blinkEvents).toEqual([]);
    expect(session.status().latestTime).toBeNull();

    const bad = chunk(6, 2, (t) => (Number.isNaN(t) ? 0 : t));
    const badData = [...bad.data];
    badData[0] = badData[0].map(() => NaN);
    session.consume({ ...bad, data: badData });
    expect(session.status().latestTime).toBeNull();
    expect(session.snapshot(1000, 2000)).toBeNull();
    expect(session.comparison()).toBeNull();
  });

  it('drops a montage or sample-rate change', () => {
    const session = new ExploreSession(['AF7', 'AF8'], rate);
    session.consume(chunk(0, 2));
    expect(session.status().supported).toBe(true);

    const rerate = new ExploreSession(channels, 128);
    rerate.consume(chunk(0, 2));
    const adopted = rerate.snapshot(origin, origin + 2000);
    expect(adopted).not.toBeNull();
    expect(adopted!.samplingRate).toBe(rate);
    expect(adopted!.endTime - adopted!.startTime).toBeLessThan(2500);
  });

  it('chooses disjoint calm and blink comparison windows', () => {
    const session = new ExploreSession(channels, rate);
    const artifact = (time: number, channel: number) =>
      calm(time) +
      ((channel === 1 || channel === 2) && Math.abs(time - 10) < 0.2 ? 180 : 0);
    session.consume(chunk(0, 20, artifact, SIGNAL_QUALITY.DISCONNECTED));
    const internal = session as unknown as {
      events: Array<{
        startTime: number;
        endTime: number;
        channels: string[];
        amplitude: number;
      }>;
    };
    internal.events = [
      {
        startTime: origin + 9900,
        endTime: origin + 10100,
        channels: ['AF7', 'AF8'],
        amplitude: 180,
      },
    ];

    const comparison = session.comparison();
    expect(comparison).not.toBeNull();
    expect(
      comparison!.calm.endTime <= comparison!.blink.startTime ||
        comparison!.calm.startTime >= comparison!.blink.endTime
    ).toBe(true);
    expect(comparison!.ratio).toBeGreaterThan(1);
  });

  it('produces owned snapshots', () => {
    const session = new ExploreSession(channels, rate);
    session.consume(chunk(0, 5));
    const snapshot = session.snapshot(origin, origin + 5000);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.channels).toEqual(channels);
    expect(snapshot!.samplingRate).toBe(rate);
    expect(snapshot!.endTime - snapshot!.startTime).toBe(5000);
  });
});
