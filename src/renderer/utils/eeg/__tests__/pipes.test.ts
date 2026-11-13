import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SIGNAL_QUALITY } from '../../../constants/constants';
import type {
  PipesEpoch,
  SignalQualityData,
} from '../../../constants/interfaces';
import { parseMuseSignalQuality } from '../pipes';

const { GREAT, OK, BAD, DISCONNECTED } = SIGNAL_QUALITY;

function run(sds: number[]): SignalQualityData[] {
  const out: SignalQualityData[] = [];
  of(
    ...sds.map(
      (sd, i) =>
        ({
          data: [[]],
          info: {
            samplingRate: 256,
            startTime: i * 250,
            channelNames: ['AF7'],
            signalQuality: { AF7: sd },
          },
        }) as PipesEpoch
    )
  )
    .pipe(parseMuseSignalQuality())
    .subscribe((epoch) => out.push(epoch as SignalQualityData));
  return out;
}

const classes = (sds: number[]) => run(sds).map((e) => e.signalQuality.AF7);

describe('parseMuseSignalQuality (windowed, with persistence)', () => {
  it('reports the windowed SD in info.signalQuality', () => {
    const out = run([4, 4, 4, 40]);
    // Median of [4, 4, 4, 40] is 4: the pop is a minority of the window.
    expect(out[3].info.signalQuality.AF7).toBe(4);
  });

  it('ignores a single blink-like spike', () => {
    expect(classes([5, 5, 5, 5, 100, 5, 5, 5])).toEqual(Array(8).fill(GREAT));
  });

  it('does not flicker when epochs alternate across a threshold', () => {
    // Instantaneous classification would alternate GREAT/BAD every epoch.
    expect(classes([5, 30, 5, 30, 5, 30, 5, 30])).toEqual(Array(8).fill(GREAT));
  });

  it('adopts a sustained bad sensor, but not in the first epoch or two', () => {
    const out = classes([5, 5, 5, 5, ...Array(12).fill(50)]);
    expect(out.slice(4, 6)).toEqual([GREAT, GREAT]);
    expect(out[out.length - 1]).toBe(BAD);
  });

  it('recovers only after sustained good data, not instantly', () => {
    const out = classes([...Array(16).fill(50), ...Array(24).fill(5)]);
    expect(out[15]).toBe(BAD);
    expect(out[16]).toBe(BAD);
    expect(out[out.length - 1]).toBe(GREAT);
  });

  it('applies a sustained flat line (disconnected) without persistence delay', () => {
    expect(classes([0])).toEqual([DISCONNECTED]);
    // A single zero epoch is not a flat line yet (median still sees signal),
    // but once the window reads flat the class changes that same epoch.
    expect(classes([5, 5, 0, 0, 0])).toEqual([
      GREAT,
      GREAT,
      GREAT,
      GREAT,
      DISCONNECTED,
    ]);
    expect(classes([0, 0, 0, 5, 5, 5, 5]).at(-1)).toBe(GREAT);
  });

  it('settles in OK for sustained middling variability', () => {
    expect(classes(Array(16).fill(18))[15]).toBe(OK);
  });
});
