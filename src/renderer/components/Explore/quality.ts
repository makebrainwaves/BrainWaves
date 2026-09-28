import { SIGNAL_QUALITY } from '../../constants/constants';

export type QualityState = 'ready' | 'settling' | 'adjust' | 'no-signal';

export interface SensorStatus {
  channel: string;
  quality: SIGNAL_QUALITY;
}

/**
 * Overall status copy above the plot (plan §5.1). The headings are the
 * product's wording; `action` names what to do. Ready has no action, so it
 * stays a light row; `adjust` is built from the sensors that need it.
 */
const QUALITY_COPY: Record<
  Exclude<QualityState, 'adjust'>,
  { heading: string; action: string }
> = {
  ready: { heading: 'Ready to explore', action: '' },
  settling: {
    heading: 'Sensors are still settling',
    action:
      'Better contact means less static. Give the sensors a few minutes to settle, and keep still.',
  },
  'no-signal': {
    heading: 'No signal detected',
    action:
      'Your headset is off or disconnected. Turn it on or reconnect it, then check that the sensors touch your skin.',
  },
};

/** Overall dot color; supporting signal only — the words carry the meaning. */
export const QUALITY_STATE_TONE: Record<QualityState, SIGNAL_QUALITY> = {
  ready: SIGNAL_QUALITY.GREAT,
  settling: SIGNAL_QUALITY.OK,
  adjust: SIGNAL_QUALITY.BAD,
  'no-signal': SIGNAL_QUALITY.DISCONNECTED,
};

/** Heading and action for a state; `adjust` names the BAD sensors. */
export function qualityCopy(state: QualityState, sensors: SensorStatus[]) {
  if (state !== 'adjust') return QUALITY_COPY[state];
  const names = new Intl.ListFormat('en').format(
    sensors
      .filter((s) => s.quality === SIGNAL_QUALITY.BAD)
      .map((s) => s.channel)
  );
  return {
    heading: `Adjust ${names}`,
    action: `Press ${names} gently against your skin — or move hair aside — and hold for 10 seconds.`,
  };
}

/**
 * One epoch's per-channel quality colors → the overall state. No sample or
 * every channel disconnected is `no-signal`; then any BAD → `adjust`, any OK
 * → `settling`, else `ready`. Callers show `waiting` before the first sample.
 */
export function summarizeQuality(
  signalQuality: Record<string, string> | undefined,
  channels: string[]
): { state: QualityState; sensors: SensorStatus[] } {
  const sensors = channels.map((channel) => ({
    channel,
    quality:
      (signalQuality?.[channel] as SIGNAL_QUALITY | undefined) ??
      SIGNAL_QUALITY.DISCONNECTED,
  }));
  const state: QualityState =
    !signalQuality ||
    sensors.every((s) => s.quality === SIGNAL_QUALITY.DISCONNECTED)
      ? 'no-signal'
      : sensors.some((s) => s.quality === SIGNAL_QUALITY.BAD)
        ? 'adjust'
        : sensors.some((s) => s.quality === SIGNAL_QUALITY.OK)
          ? 'settling'
          : 'ready';
  return { state, sensors };
}
