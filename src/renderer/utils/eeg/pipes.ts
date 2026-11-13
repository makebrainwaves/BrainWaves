import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PLOTTING_INTERVAL,
  SIGNAL_QUALITY,
  SIGNAL_QUALITY_IMPROVE_MS,
  SIGNAL_QUALITY_THRESHOLDS,
  SIGNAL_QUALITY_WINDOW_MS,
  SIGNAL_QUALITY_WORSEN_MS,
} from '../../constants/constants';
import { PipesEpoch } from '../../constants/interfaces';

const WINDOW_EPOCHS = Math.max(
  1,
  Math.round(SIGNAL_QUALITY_WINDOW_MS / PLOTTING_INTERVAL)
);
const WORSEN_EPOCHS = Math.max(
  1,
  Math.round(SIGNAL_QUALITY_WORSEN_MS / PLOTTING_INTERVAL)
);
const IMPROVE_EPOCHS = Math.max(
  1,
  Math.round(SIGNAL_QUALITY_IMPROVE_MS / PLOTTING_INTERVAL)
);

/** Severity ladder for the contact classes; DISCONNECTED is handled separately (a flat line is unambiguous). */
const SEVERITY: Partial<Record<SIGNAL_QUALITY, number>> = {
  [SIGNAL_QUALITY.GREAT]: 0,
  [SIGNAL_QUALITY.OK]: 1,
  [SIGNAL_QUALITY.BAD]: 2,
};

function classify(sd: number): SIGNAL_QUALITY {
  if (!Number.isFinite(sd) || sd < SIGNAL_QUALITY_THRESHOLDS.GREAT)
    return SIGNAL_QUALITY.DISCONNECTED;
  if (sd >= SIGNAL_QUALITY_THRESHOLDS.BAD) return SIGNAL_QUALITY.BAD;
  if (sd >= SIGNAL_QUALITY_THRESHOLDS.OK) return SIGNAL_QUALITY.OK;
  return SIGNAL_QUALITY.GREAT;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

interface ChannelState {
  /** Per-epoch SDs inside the rolling window, oldest first. */
  window: number[];
  current: SIGNAL_QUALITY | null;
  candidate: SIGNAL_QUALITY | null;
  candidateCount: number;
}

/**
 * Classifies each channel's signal quality from the median per-epoch standard
 * deviation over a rolling window (default 3 s), with asymmetric persistence:
 * a worse class must hold for ~500 ms to be reported, a better one for ~1 s,
 * and DISCONNECTED (flat line) applies immediately. The median makes single
 * blinks/pops a minority of the window instead of a 250 ms BAD flash, and the
 * persistence keeps borderline sensors from flickering between classes.
 * The reported `info.signalQuality` is the windowed SD, not the raw epoch SD.
 */
export const parseMuseSignalQuality = () => {
  const channels = new Map<string, ChannelState>();
  return pipe(
    map((epoch: PipesEpoch) => {
      const windowed: Record<string, number> = {};
      const signalQuality: Record<string, SIGNAL_QUALITY> = {};
      // @neurosity/pipes >=5 puts addSignalQuality()'s output under
      // info.signalQuality (older versions used a top-level field). Reading the
      // old top-level path yielded undefined → Object.entries() threw, which
      // killed the whole signal-quality/EEG stream to the viewer.
      for (const [name, sd] of Object.entries(epoch.info.signalQuality)) {
        let state = channels.get(name);
        if (!state) {
          state = {
            window: [],
            current: null,
            candidate: null,
            candidateCount: 0,
          };
          channels.set(name, state);
        }
        if (Number.isFinite(sd)) {
          state.window.push(sd);
          if (state.window.length > WINDOW_EPOCHS) state.window.shift();
        }
        const pooled = state.window.length ? median(state.window) : NaN;
        windowed[name] = pooled;
        const raw = classify(pooled);
        if (state.current === null || raw === state.current) {
          state.current = raw;
          state.candidate = null;
          state.candidateCount = 0;
        } else if (
          raw === SIGNAL_QUALITY.DISCONNECTED ||
          state.current === SIGNAL_QUALITY.DISCONNECTED
        ) {
          state.current = raw;
          state.candidate = null;
          state.candidateCount = 0;
        } else {
          if (state.candidate !== raw) {
            state.candidate = raw;
            state.candidateCount = 1;
          } else {
            state.candidateCount += 1;
          }
          const required =
            (SEVERITY[raw] ?? 0) > (SEVERITY[state.current] ?? 0)
              ? WORSEN_EPOCHS
              : IMPROVE_EPOCHS;
          if (state.candidateCount >= required) {
            state.current = raw;
            state.candidate = null;
            state.candidateCount = 0;
          }
        }
        signalQuality[name] = state.current;
      }
      return {
        ...epoch,
        info: { ...epoch.info, signalQuality: windowed },
        signalQuality,
      };
    })
  );
};
