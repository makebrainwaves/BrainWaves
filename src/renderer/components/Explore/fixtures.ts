import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import { SIGNAL_QUALITY } from '../../constants/constants';

/** Muse montage order, matching the live viewer's channel order. */
export const EXPLORE_CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'];
export const FRONTAL_CHANNELS = ['AF7', 'AF8'];
export const POSTERIOR_CHANNELS = ['TP9', 'TP10'];
export const SAMPLING_RATE = 256;

/**
 * Stable per-channel trace colors for the noise demonstration. Signal-quality
 * colors would repaint the lines while the student is watching them move, so
 * the demo uses these fixed hues instead (plan §5.2).
 */
export const STABLE_TRACE_COLORS = ['#4263eb', '#9c36b5', '#f08c00', '#1098ad'];
export const STABLE_COLOR_BY_CHANNEL: Record<string, string> = {
  TP9: STABLE_TRACE_COLORS[0],
  AF7: STABLE_TRACE_COLORS[1],
  AF8: STABLE_TRACE_COLORS[2],
  TP10: STABLE_TRACE_COLORS[3],
};

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
 * sensors, and an alpha burst weighted to TP9/TP10. Not recorded data.
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
          posterior * 22 * edge * Math.sin((2 * Math.PI * 10.5 * t) / 1000);
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
    peakToPeak: Math.max(
      ...data.map((s) => Math.max(...s) - Math.min(...s))
    ),
  };
}

const blinkBand = (id: string, startTime: number, endTime: number): PlotAnnotation => ({
  id: `blink-${id}`,
  startTime,
  endTime,
  label: 'blink · eye muscle, not brain',
  tone: 'blink',
});

/** Live four-sensor window for the connected surface. */
export const LIVE_SNAPSHOT = makeSnapshot(EXPLORE_CHANNELS, 5000, {
  seed: 11,
});

/** Flat traces for the `No signal detected` state: contact, not data. */
export const NO_SIGNAL_SNAPSHOT = makeSnapshot(EXPLORE_CHANNELS, 5000, {
  seed: 12,
  gain: 0.04,
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

/** Stable-color demo: all four sensors while blinking, for the §5.2 story. */
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
export const COMPARISON_SHARED_SCALE = 150;
export const COMPARISON_RATIO =
  BLINKING_SNAPSHOT.peakToPeak / CALM_SNAPSHOT.peakToPeak;

/** Eyes-closed review: the marked interval with an alpha burst on TP9/TP10. */
export const EYES_CLOSED_SNAPSHOT = makeSnapshot(EXPLORE_CHANNELS, 15500, {
  seed: 41,
  alphaMs: [3000, 13000],
});
export const EYES_CLOSED_ANNOTATIONS: PlotAnnotation[] = [
  {
    id: 'eyes-closed',
    startTime: 3000,
    endTime: 13000,
    label: 'eyes closed',
    endLabel: 'eyes open',
    tone: 'eyes-closed',
  },
];

/** Live window shown during the countdown and interval. */
export const EYES_CLOSED_LIVE = makeSnapshot(EXPLORE_CHANNELS, 5000, {
  seed: 42,
});

/** Measured 8–12 Hz comparison for the result stories (eyes-closed ÷ before). */
export const ALPHA_INCREASE_RATIO = 2.4;
export const ALPHA_NO_EFFECT_RATIO = 0.9;

export interface SensorStatus {
  channel: string;
  quality: SIGNAL_QUALITY;
}

export type QualityState = 'ready' | 'settling' | 'adjust' | 'no-signal';

/**
 * Overall status above the plot (plan §5.1). The four headings are the
 * product's wording; `action` names what to do where an action exists.
 */
export const QUALITY_SCENARIOS: Record<
  QualityState,
  { heading: string; action: string; sensors: SensorStatus[] }
> = {
  ready: {
    heading: 'Ready to explore',
    action: 'Sit still and watch your signal, then start a lesson below.',
    sensors: EXPLORE_CHANNELS.map((channel) => ({
      channel,
      quality: SIGNAL_QUALITY.GREAT,
    })),
  },
  settling: {
    heading: 'Sensors are still settling',
    action:
      'Contact can improve over several minutes. Sit still and let the measurements calm down.',
    sensors: EXPLORE_CHANNELS.map((channel) => ({
      channel,
      quality:
        channel === 'TP10' ? SIGNAL_QUALITY.GREAT : SIGNAL_QUALITY.OK,
    })),
  },
  adjust: {
    heading: 'Adjust AF7 and TP10',
    action:
      'Press AF7 and TP10 gently against your skin — or move hair aside — and hold for 10 seconds.',
    sensors: EXPLORE_CHANNELS.map((channel) => ({
      channel,
      quality:
        channel === 'AF7' || channel === 'TP10'
          ? SIGNAL_QUALITY.BAD
          : channel === 'AF8'
            ? SIGNAL_QUALITY.OK
            : SIGNAL_QUALITY.GREAT,
    })),
  },
  'no-signal': {
    heading: 'No signal detected',
    action:
      'Check that the headset is on your head and every sensor is touching your skin.',
    sensors: EXPLORE_CHANNELS.map((channel) => ({
      channel,
      quality: SIGNAL_QUALITY.DISCONNECTED,
    })),
  },
};

/** Overall dot color; supporting signal only — the words carry the meaning. */
export const QUALITY_STATE_TONE: Record<QualityState, SIGNAL_QUALITY> = {
  ready: SIGNAL_QUALITY.GREAT,
  settling: SIGNAL_QUALITY.OK,
  adjust: SIGNAL_QUALITY.BAD,
  'no-signal': SIGNAL_QUALITY.DISCONNECTED,
};

/** Plan §5.1 wording, shown before the student judges anything. */
export const NOISE_DEFINITION =
  'Noise is electrical activity the headset records that did not come from the brain signal we are trying to measure. Blinks, jaw tension, movement, and poor sensor contact can all create noise.';

export const NOISE_SETTLING_NOTE =
  'Not a sound — think of it as static in the recording. Sensor contact often improves over several minutes while the sensors sit on your skin; there is no fixed warm-up time. The live measurements tell you when you are ready.';

/** Blink lesson steps (plan §5.3). `action` is the expected step at a glance. */
export const BLINK_STEPS: {
  title: string;
  action: string;
  body: string;
}[] = [
  {
    title: 'Blink once and find the marked response',
    action: 'Blink once, then keep still and watch AF7 and AF8.',
    body: 'A blink drops one big slow hump onto the two front sensors — your eyelid muscle moving, not your brain thinking. When we spot one, the plot marks it with a gold band.',
  },
  {
    title: 'Predict what another blink will do',
    action: 'Guess first, then blink once and check.',
    body: 'The lines are flat again. Before you blink, decide what the next blink will look like — then blink once and see whether you were right.',
  },
  {
    title: 'Blink several times so it is unmistakable',
    action: 'Blink hard, three or four times in a row.',
    body: 'Each blink slams another hump into the front sensors. This is the loudest thing in most student recordings — and seeing it land every time is how you know your headset is really hearing you.',
  },
  {
    title: 'Compare the blinking interval with a quiet interval',
    action: 'Look at both windows, same sensors and same scale.',
    body: 'One frozen five seconds while you were blinking, one while you sat still. Your brain signal is in both — the blinks just tower over it. This is why researchers ask you to hold still.',
  },
];

export const BLINK_NOT_DETECTED =
  'We cannot see your blinks yet. Check that AF7 and AF8 sit flat against your forehead, then try again. Detection is not required — Next stays open whenever you are ready to move on.';

export const EYES_INTRO_BODY =
  'Two sounds guide this activity. One chime means close your eyes now. Two chimes, about ten seconds later, mean open them again. Nothing on screen needs watching in between.';
export const EYES_INTRO_BODY_2 =
  'When you press Begin, a visible 3–2–1 countdown comes first, so the start never surprises you.';

export const EYES_INTERVAL_BODY =
  'Keep them closed until you hear two chimes. Sitting still is fine — the screen can wait.';

export const EYES_END_BODY =
  'Two chimes just ended the activity. Your marked interval is saved on the plot below — take a look.';

export const ALPHA_RESULT_BODY =
  'The teal band marks the ten seconds your eyes were closed. The back of your head hums a steady rhythm when it has nothing to look at — that hum is alpha, and it is the seeing part of your brain getting louder.';

export const ALPHA_NO_EFFECT_BODY =
  'Alpha did not increase in this interval. That is a real result, not a failed lesson — alpha is clearest in some people and nearly invisible in others. Blinking still worked, and that one really was your eyelid.';

export const EYES_PROXY_NOTE =
  'Muse has no sensors over the visual cortex — TP9 and TP10 behind the ears are the closest available posterior-side look at alpha.';

export const ALPHA_EXAMPLE_CAPTION =
  'Some recordings look like this. Yours will be yours.';