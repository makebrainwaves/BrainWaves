import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import {
  MUSE_SAMPLING_RATE,
  SIGNAL_QUALITY,
} from '../../constants/constants';
import type { SignalQualityData } from '../../constants/interfaces';
import type { QualityState, SensorStatus } from './quality';

/** Muse montage order, matching the live viewer's channel order. */
export const EXPLORE_CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'];
export const FRONTAL_CHANNELS = ['AF7', 'AF8'];
export const POSTERIOR_CHANNELS = ['TP9', 'TP10'];
export const SAMPLING_RATE = MUSE_SAMPLING_RATE;

/** Device identity for the plot legend; integration reads both from deviceInfo. */
export const DEVICE_NAME = 'Muse-1A2B';
export const PLOT_LEGEND = `${DEVICE_NAME} · ${SAMPLING_RATE} Hz`;

/** Deterministic PRNG so every screenshot of the synthetic signal is identical. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bump = (t: number, center: number, width: number) =>
  Math.exp(-((t - center) ** 2) / (2 * width ** 2));

export interface TraceSpec {
  seed: number;
  /** Blink centers on the snapshot's own clock (0 = snapshot start), in ms. */
  blinksMs?: number[];
  /** Eyes-closed window on the snapshot's own clock, in ms. */
  alphaMs?: [number, number];
  /** Scales the whole signal; near zero for the no-signal state. */
  gain?: number;
}

/**
 * Synthetic multi-channel EEG for the fixture plot: background 10 Hz / 5 Hz
 * rhythms with random phase, sensor noise, blink humps weighted to the frontal
 * sensors, and a steady back-of-head rhythm weighted to TP9/TP10 while the
 * eyes are closed. Not recorded data.
 */
export function makeSnapshot(
  channels: string[],
  durationMs: number,
  spec: TraceSpec
): EEGSnapshot {
  const random = mulberry32(spec.seed);
  const step = 1000 / SAMPLING_RATE;
  const count = Math.round(durationMs / step) + 1;
  const phases = channels.map(() => random() * Math.PI * 2);
  const data = channels.map((channel, i) => {
    const frontal = FRONTAL_CHANNELS.includes(channel) ? 1 : 0.3;
    const posterior = POSTERIOR_CHANNELS.includes(channel) ? 1 : 0.35;
    const samples = new Array<number>(count);
    for (let n = 0; n < count; n += 1) {
      const t = n * step;
      let value =
        6 * Math.sin((2 * Math.PI * 10 * t) / 1000 + phases[i]) +
        5 * Math.sin((2 * Math.PI * 5.5 * t) / 1000 + phases[i] * 1.7) +
        (random() - 0.5) * 8;
      for (const center of spec.blinksMs ?? []) {
        value += frontal * 130 * bump(t, center, 110);
      }
      if (spec.alphaMs && t >= spec.alphaMs[0] && t <= spec.alphaMs[1]) {
        const edge = Math.min(
          1,
          (t - spec.alphaMs[0]) / 400,
          (spec.alphaMs[1] - t) / 400
        );
        value +=
          posterior * 15 * edge * Math.sin((2 * Math.PI * 10.5 * t) / 1000);
      }
      samples[n] = value * (spec.gain ?? 1);
    }
    return samples;
  });
  return {
    startTime: 0,
    endTime: durationMs,
    data,
    channels,
    samplingRate: SAMPLING_RATE,
    peakToPeak: Math.max(...data.map((s) => Math.max(...s) - Math.min(...s))),
  };
}

const blinkBand = (
  id: string,
  startTime: number,
  endTime: number
): PlotAnnotation => ({
  id: `blink-${id}`,
  startTime,
  endTime,
  label: 'blink · from your eyes, not your brain',
  tone: 'blink',
});

/** Live four-sensor window for the connected surface. */
export const LIVE_SNAPSHOT = makeSnapshot(EXPLORE_CHANNELS, 5000, {
  seed: 11,
});

/** Flat traces for the `No signal detected` state: no contact, not data. */
export const NO_SIGNAL_SNAPSHOT = makeSnapshot(EXPLORE_CHANNELS, 5000, {
  seed: 12,
  gain: 0.04,
});

/** A headset that reports no AF8: the unsupported-channel state. */
export const NO_AF8_CHANNELS = ['TP9', 'AF7', 'TP10'];
export const NO_AF8_SENSORS: SensorStatus[] = NO_AF8_CHANNELS.map(
  (channel) => ({ channel, quality: SIGNAL_QUALITY.GREAT })
);
export const NO_AF8_SNAPSHOT = makeSnapshot(NO_AF8_CHANNELS, 5000, {
  seed: 13,
});

/** Blink step 1: one blink, one marked response. */
export const BLINK_ONE = makeSnapshot(FRONTAL_CHANNELS, 5000, {
  seed: 21,
  blinksMs: [2100],
});
export const BLINK_ONE_ANNOTATIONS = [blinkBand('one', 1650, 2650)];

/** Blink step 2: the first marked blink, second not yet taken. */
export const BLINK_PREDICT = makeSnapshot(FRONTAL_CHANNELS, 5000, {
  seed: 22,
  blinksMs: [1050],
});
export const BLINK_PREDICT_ANNOTATIONS = [blinkBand('predict', 650, 1550)];

/** Blink step 3: several blinks so the effect is unmistakable. */
export const BLINK_MANY = makeSnapshot(FRONTAL_CHANNELS, 5000, {
  seed: 23,
  blinksMs: [900, 2050, 3250, 4350],
});
export const BLINK_MANY_ANNOTATIONS = [
  blinkBand('m1', 500, 1350),
  blinkBand('m2', 1650, 2500),
  blinkBand('m3', 2850, 3700),
  blinkBand('m4', 3950, 4750),
];

/** Stable-color demo: all four sensors while blinking (plan §5.2). */
export const BLINK_MANY_ALL = makeSnapshot(EXPLORE_CHANNELS, 5000, {
  seed: 24,
  blinksMs: [900, 2050, 3250, 4350],
});

/** Blink step 4: two frozen five-second windows at one shared scale. */
export const CALM_SNAPSHOT = makeSnapshot(FRONTAL_CHANNELS, 5000, {
  seed: 31,
});
export const BLINKING_SNAPSHOT = makeSnapshot(FRONTAL_CHANNELS, 5000, {
  seed: 32,
  blinksMs: [1150, 2350, 3650],
});
export const COMPARISON_RATIO =
  BLINKING_SNAPSHOT.peakToPeak / CALM_SNAPSHOT.peakToPeak;

/** Live window shown during the countdown and interval. */
export const EYES_CLOSED_LIVE = makeSnapshot(EXPLORE_CHANNELS, 5000, {
  seed: 42,
});

/**
 * The review view: equal 3-second segments from the eyes-open and eyes-closed
 * parts of the marked interval, on one shared µV scale. At this length a
 * ~10 Hz rhythm is ~29 px per cycle at 1366×768 — visible with real Muse
 * amplitudes; 10-second segments would compress it to ~9 px (mush).
 */
export const REVIEW_SEGMENT_MS = 3000;
export const REVIEW_SEGMENT_SCALE = 50;
export const OPEN_SEGMENT = makeSnapshot(POSTERIOR_CHANNELS, REVIEW_SEGMENT_MS, {
  seed: 51,
  gain: 0.6,
});
export const CLOSED_SEGMENT = makeSnapshot(POSTERIOR_CHANNELS, REVIEW_SEGMENT_MS, {
  seed: 52,
  alphaMs: [0, REVIEW_SEGMENT_MS],
});

/** Measured comparison (eyes-closed ÷ before) for the result stories. */
export const RHYTHM_INCREASE_RATIO = 2.4;
export const RHYTHM_NO_EFFECT_RATIO = 0.9;

/** A one-emission fixture stream for `SignalQualityIndicatorComponent`. */
export function qualitySample(sensors: SensorStatus[]): SignalQualityData {
  return {
    data: sensors.map(() => []),
    info: {
      samplingRate: SAMPLING_RATE,
      startTime: 0,
      signalQuality: Object.fromEntries(sensors.map((s) => [s.channel, 2])),
    },
    signalQuality: Object.fromEntries(
      sensors.map((s) => [s.channel, s.quality])
    ),
  };
}

/** Per-sensor quality for each overall state's story (copy lives in `quality.ts`). */
export const QUALITY_SENSORS: Record<QualityState, SensorStatus[]> = {
  ready: EXPLORE_CHANNELS.map((channel) => ({
    channel,
    quality: SIGNAL_QUALITY.GREAT,
  })),
  settling: EXPLORE_CHANNELS.map((channel) => ({
    channel,
    quality: channel === 'TP10' ? SIGNAL_QUALITY.GREAT : SIGNAL_QUALITY.OK,
  })),
  adjust: EXPLORE_CHANNELS.map((channel) => ({
    channel,
    quality:
      channel === 'AF7' || channel === 'TP10'
        ? SIGNAL_QUALITY.BAD
        : channel === 'AF8'
          ? SIGNAL_QUALITY.OK
          : SIGNAL_QUALITY.GREAT,
  })),
  'no-signal': EXPLORE_CHANNELS.map((channel) => ({
    channel,
    quality: SIGNAL_QUALITY.DISCONNECTED,
  })),
};

/** Plan §5.1 wording, shown before the student judges anything. */
export const NOISE_DEFINITION =
  'Noise is electrical activity the headset records that did not come from the brain signal we are trying to measure. Blinks, jaw tension, movement, and poor sensor contact can all create noise.';

export const NOISE_SETTLING_NOTE =
  'Not a sound — think of it as static in the recording. Better contact means less static: it usually improves over several minutes as the sensors settle onto your skin, and there is no fixed warm-up time.';

/** Blink lesson steps (plan §5.3). `action` is the expected step at a glance. */
export const BLINK_STEPS: {
  title: string;
  action: string;
  body: string;
}[] = [
  {
    title: 'Blink once and find the marked response',
    action: 'Blink once, then keep still and watch AF7 and AF8.',
    body: 'A blink drops one big slow hump onto the two front sensors — from your eyes moving, not your brain thinking. When we spot one, the plot marks it with a gold band.',
  },
  {
    title: 'Predict what another blink will do',
    action: 'Guess first, then blink once and check.',
    body: 'The lines are flat again. Before you blink, decide what the next blink will look like — then blink once and see whether you were right.',
  },
  {
    title: 'Now blink several times in a row!',
    action: 'Blink hard, three or four times in a row.',
    body: 'Blinks are one of the loudest things in your signal. Seeing each one land clearly is good news: it means the front sensors are touching your skin and really picking you up.',
  },
  {
    title: 'Compare the blinking interval with a quiet interval',
    action: 'Now sit still, eyes open, for 5 seconds.',
    body: 'Five paused seconds while you were blinking, five while you sat still. Your brain signal is in both — the blinks just tower over it. This is why researchers ask you to hold still.',
  },
];

export const BLINK_NOT_DETECTED =
  'We cannot see your blinks yet. Check that AF7 and AF8 sit flat against your forehead, then try again.';

export const EYES_INTRO_OPENER =
  'Let’s look at how your brain signal changes when you close your eyes';
export const EYES_INTRO_BODY =
  'Two sounds guide this activity. One chime means close your eyes now. Two chimes, about ten seconds later, mean open them again. Nothing on screen needs watching in between.';

export const EYES_PROXY_NOTE =
  'Muse has no sensors over the visual cortex — TP9 and TP10 behind the ears are the closest look at the back of your head.';

export const EYES_INTERVAL_BODY = 'Keep them closed until you hear two chimes.';

export const EYES_END_BODY = 'Let’s look at your brainwaves.';

export const ALPHA_RESULT_BODY =
  'With your eyes closed, the seeing part of your brain has nothing to look at — and it gets louder.';
export const ALPHA_NO_EFFECT_BODY =
  'That is a real result, not a failed lesson — this change is clearest in some people and nearly invisible in others.';
export const ALPHA_EXAMPLE_CAPTION =
  'Some recordings look like this. Yours will be yours.';