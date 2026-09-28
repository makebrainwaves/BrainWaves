import { describe, expect, it } from 'vitest';
import { SIGNAL_QUALITY } from '../../constants/constants';
import { qualityCopy, summarizeQuality } from './quality';

const CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'];
const { GREAT, OK, BAD, DISCONNECTED } = SIGNAL_QUALITY;
const sample = (...qualities: SIGNAL_QUALITY[]) =>
  Object.fromEntries(CHANNELS.map((channel, i) => [channel, qualities[i]]));

describe('summarizeQuality', () => {
  it('ranks no signal, then BAD, then OK, then ready', () => {
    expect(summarizeQuality(undefined, CHANNELS).state).toBe('no-signal');
    expect(
      summarizeQuality(
        sample(DISCONNECTED, DISCONNECTED, DISCONNECTED, DISCONNECTED),
        CHANNELS
      ).state
    ).toBe('no-signal');
    expect(
      summarizeQuality(sample(OK, BAD, GREAT, DISCONNECTED), CHANNELS).state
    ).toBe('adjust');
    expect(
      summarizeQuality(sample(OK, GREAT, GREAT, DISCONNECTED), CHANNELS).state
    ).toBe('settling');
    expect(
      summarizeQuality(sample(GREAT, GREAT, GREAT, GREAT), CHANNELS).state
    ).toBe('ready');
  });

  it('treats a channel missing from the epoch as disconnected', () => {
    const { sensors } = summarizeQuality({ AF7: GREAT }, CHANNELS);
    expect(sensors.map((s) => s.quality)).toEqual([
      DISCONNECTED,
      GREAT,
      DISCONNECTED,
      DISCONNECTED,
    ]);
  });

  it('names exactly the BAD sensors in the adjust copy', () => {
    const { state, sensors } = summarizeQuality(
      sample(GREAT, BAD, OK, BAD),
      CHANNELS
    );
    expect(qualityCopy(state, sensors).heading).toBe('Adjust AF7 and TP10');
  });
});
