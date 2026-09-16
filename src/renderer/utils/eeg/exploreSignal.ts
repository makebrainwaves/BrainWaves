import type { EEGSnapshot } from '../../../shared/eegVizTypes';
import {
  SIGNAL_QUALITY,
  SIGNAL_QUALITY_THRESHOLDS,
} from '../../constants/constants';
import type { SignalQualityData } from '../../constants/interfaces';

export interface BlinkEvent {
  startTime: number;
  endTime: number;
  channels: string[];
  amplitude: number;
}

export interface ExploreStatus {
  baselineStable: boolean;
  blinkEvents: BlinkEvent[];
  latestTime: number | null;
  supported: boolean;
  bufferedDuration: number;
}

export interface FrozenComparison {
  calm: EEGSnapshot;
  blink: EEGSnapshot;
  sharedScale: number;
  ratio: number;
}

const BUFFER_MS = 60000;
const WINDOW_MS = 5000;
const FRONTAL = ['AF7', 'AF8'];

/** Causal second-order Butterworth section; unlike offline zero-phase filters, it delays peaks. */
class Butterworth {
  private z1 = 0;
  private z2 = 0;
  private readonly b0: number;
  private readonly b1: number;
  private readonly b2: number;
  private readonly a1: number;
  private readonly a2: number;

  constructor(rate: number, cutoff: number, highpass: boolean) {
    const omega = (2 * Math.PI * cutoff) / rate;
    const cosine = Math.cos(omega);
    const alpha = Math.sin(omega) / Math.SQRT2;
    const a0 = 1 + alpha;
    this.b0 = (highpass ? 1 + cosine : 1 - cosine) / (2 * a0);
    this.b1 = (highpass ? -(1 + cosine) : 1 - cosine) / a0;
    this.b2 = this.b0;
    this.a1 = (-2 * cosine) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  next(value: number): number {
    const output = this.b0 * value + this.z1;
    this.z1 = this.b1 * value - this.a1 * output + this.z2;
    this.z2 = this.b2 * value - this.a2 * output;
    return output;
  }
}

/** Fixed-size running moments keep calibration O(1) per sample. */
class Moments {
  private readonly values: Float64Array;
  private cursor = 0;
  count = 0;
  private sum = 0;
  private squares = 0;

  constructor(size: number) {
    this.values = new Float64Array(size);
  }

  add(value: number): void {
    const old = this.values[this.cursor];
    this.sum += value - old;
    this.squares += value * value - old * old;
    this.values[this.cursor] = value;
    this.cursor = (this.cursor + 1) % this.values.length;
    this.count = Math.min(this.count + 1, this.values.length);
  }

  variance(): number {
    return Math.max(
      0,
      this.squares / this.count - (this.sum / this.count) ** 2
    );
  }
}

interface FrontalState {
  index: number;
  offset: number | null;
  highpass: Butterworth;
  lowpass: Butterworth;
  muscle: Butterworth;
  raw: Moments;
  low: Moments;
  high: Moments;
  threshold: number;
  value: number;
  highValue: number;
}

interface Candidate {
  startTime: number;
  sign: number;
  peaks: number[];
  minima: number[];
  maxima: number[];
  energy: number[];
  cross: number;
  highEnergy: number;
}

/**
 * Live educational heuristic, not a validated clinical EOG classifier. Input is already µV.
 * MNE's 1–10 Hz EOG passband/adaptive threshold and ICLabel's bilateral slow ocular field
 * motivate the detector; ICA source classification is not possible from these two sensors.
 * Existing signal-quality stddev limits gate calibration, not blink amplitude. Thresholds
 * are learned from two quiet seconds after filter warm-up; real Muse validation is pending.
 */
export class ExploreSession {
  private channels: string[];
  private samplingRate: number;
  private capacity = 0;
  private data: Float64Array[] = [];
  private times = new Float64Array(0);
  private cursor = 0;
  private size = 0;
  private lastChunkStart: number | null = null;
  private frontal: FrontalState[] = [];
  private stable = false;
  private unstableSince: number | null = null;
  private candidate: Candidate | null = null;
  private refractoryUntil = -Infinity;
  private calibrationAfter = -Infinity;
  private events: BlinkEvent[] = [];

  constructor(channels: string[], samplingRate: number) {
    this.channels = [...channels];
    this.samplingRate = samplingRate;
    this.reset();
  }

  reset(): void {
    this.capacity =
      Number.isFinite(this.samplingRate) && this.samplingRate > 0
        ? Math.ceil((BUFFER_MS * this.samplingRate) / 1000)
        : 0;
    this.data = this.channels.map(() => new Float64Array(this.capacity));
    this.times = new Float64Array(this.capacity);
    this.cursor = 0;
    this.size = 0;
    this.lastChunkStart = null;
    this.stable = false;
    this.unstableSince = null;
    this.candidate = null;
    this.refractoryUntil = -Infinity;
    this.calibrationAfter = -Infinity;
    this.events = [];
    this.frontal = [];
    if (
      this.samplingRate > 40 &&
      FRONTAL.every((name) => this.channels.includes(name))
    ) {
      this.frontal = FRONTAL.map((name) => ({
        index: this.channels.indexOf(name),
        offset: null,
        highpass: new Butterworth(this.samplingRate, 1, true),
        lowpass: new Butterworth(this.samplingRate, 10, false),
        muscle: new Butterworth(this.samplingRate, 20, true),
        raw: new Moments(Math.ceil(this.samplingRate * 2)),
        low: new Moments(Math.ceil(this.samplingRate * 2)),
        high: new Moments(Math.ceil(this.samplingRate * 2)),
        threshold: Infinity,
        value: 0,
        highValue: 0,
      }));
    }
  }

  consume(chunk: SignalQualityData): void {
    const { startTime, samplingRate } = chunk.info;
    const names = chunk.info.channelNames ?? this.channels;
    if (
      !Number.isFinite(startTime) ||
      !Number.isFinite(samplingRate) ||
      samplingRate <= 0 ||
      names.length === 0 ||
      new Set(names).size !== names.length ||
      chunk.data.length !== names.length ||
      chunk.data.some((values) => values.length !== chunk.data[0].length)
    ) {
      this.reset();
      return;
    }
    if (!chunk.data[0].length) return;
    if (
      samplingRate !== this.samplingRate ||
      names.length !== this.channels.length ||
      names.some((name, index) => name !== this.channels[index])
    ) {
      this.channels = [...names];
      this.samplingRate = samplingRate;
      this.reset();
    }
    if (this.lastChunkStart !== null && startTime < this.lastChunkStart)
      this.reset();
    this.lastChunkStart = startTime;
    const dt = 1000 / this.samplingRate;
    for (let sample = 0; sample < chunk.data[0].length; sample++) {
      const time = startTime + sample * dt;
      const latest = this.size
        ? this.times[(this.cursor + this.capacity - 1) % this.capacity]
        : null;
      if (latest !== null && time <= latest + dt * 0.25) continue;
      if (chunk.data.some((values) => !Number.isFinite(values[sample]))) {
        this.reset();
        this.lastChunkStart = startTime;
        continue;
      }
      if (latest !== null && Math.abs(time - latest - dt) > dt * 0.5) {
        this.reset();
        this.lastChunkStart = startTime;
      }
      this.times[this.cursor] = time;
      for (let channel = 0; channel < this.channels.length; channel++) {
        this.data[channel][this.cursor] = chunk.data[channel][sample];
      }
      this.cursor = (this.cursor + 1) % this.capacity;
      this.size = Math.min(this.capacity, this.size + 1);
      if (this.frontal.length) this.detect(time, chunk, sample);
    }
    if (this.size) {
      const oldest = this.timeAt(0);
      while (this.events.length && this.events[0].startTime < oldest)
        this.events.shift();
    }
  }

  private detect(time: number, chunk: SignalQualityData, sample: number): void {
    let qualityGood = true;
    let usable = true;
    let quiet = true;
    for (const state of this.frontal) {
      const raw = chunk.data[state.index][sample];
      state.offset ??= raw;
      const centered = raw - state.offset;
      state.value = state.lowpass.next(state.highpass.next(centered));
      state.highValue = state.muscle.next(centered);
      state.raw.add(centered);
      state.low.add(state.value);
      state.high.add(state.highValue);
      const name = this.channels[state.index];
      const metric = chunk.info.signalQuality[name];
      const quality = chunk.signalQuality[name];
      usable &&=
        Number.isFinite(metric) &&
        quality !== undefined &&
        quality !== SIGNAL_QUALITY.DISCONNECTED;
      qualityGood &&=
        Number.isFinite(metric) &&
        metric >= SIGNAL_QUALITY_THRESHOLDS.GREAT &&
        metric < SIGNAL_QUALITY_THRESHOLDS.BAD &&
        (quality === SIGNAL_QUALITY.GREAT || quality === SIGNAL_QUALITY.OK);
      const variance = state.raw.variance();
      quiet &&=
        variance > 1e-12 &&
        variance < SIGNAL_QUALITY_THRESHOLDS.BAD ** 2 &&
        state.high.variance() < variance * 0.35;
    }
    if (!usable) {
      this.stable = false;
      this.candidate = null;
      this.calibrationAfter = time + 2000;
      return;
    }
    const warm = this.size >= Math.ceil(3 * this.samplingRate);
    if (!this.candidate && time >= this.calibrationAfter && warm) {
      if (quiet && qualityGood) {
        this.stable = true;
        this.unstableSince = null;
        for (const state of this.frontal) {
          state.threshold = Math.max(
            6 * Math.sqrt(state.low.variance()),
            3 * Math.sqrt(state.raw.variance())
          );
        }
      } else {
        this.unstableSince ??= time;
        if (time - this.unstableSince >= 750) this.stable = false;
      }
    }
    if (!this.stable || time < this.refractoryUntil) return;
    const left = this.frontal[0];
    const right = this.frontal[1];
    if (!this.candidate) {
      if (
        Math.abs(left.value) < left.threshold ||
        Math.abs(right.value) < right.threshold ||
        left.value * right.value <= 0
      )
        return;
      this.candidate = {
        startTime: time,
        sign: Math.sign(left.value),
        peaks: [0, 0],
        minima: [Infinity, Infinity],
        maxima: [-Infinity, -Infinity],
        energy: [0, 0],
        cross: 0,
        highEnergy: 0,
      };
    }
    const { candidate } = this;
    for (let index = 0; index < 2; index++) {
      const state = this.frontal[index];
      candidate.peaks[index] = Math.max(
        candidate.peaks[index],
        candidate.sign * state.value
      );
      candidate.energy[index] += state.value ** 2;
      candidate.highEnergy += state.highValue ** 2;
      const raw = chunk.data[state.index][sample];
      candidate.minima[index] = Math.min(candidate.minima[index], raw);
      candidate.maxima[index] = Math.max(candidate.maxima[index], raw);
    }
    candidate.cross += left.value * right.value;
    const duration = time - candidate.startTime;
    const returned = this.frontal.every(
      (state, index) =>
        candidate.sign * state.value <
        Math.max(state.threshold * 0.4, candidate.peaks[index] * 0.2)
    );
    if (!returned && duration <= 400) return;
    const correlation =
      candidate.cross / Math.sqrt(candidate.energy[0] * candidate.energy[1]);
    const balance = candidate.peaks[0] / candidate.peaks[1];
    if (
      duration >= 100 &&
      duration <= 400 &&
      correlation >= 0.8 &&
      balance >= 0.3 &&
      balance <= 3 &&
      candidate.highEnergy < 0.3 * (candidate.energy[0] + candidate.energy[1])
    ) {
      this.events.push({
        startTime: candidate.startTime,
        endTime: time,
        channels: [...FRONTAL],
        amplitude: Math.max(
          candidate.maxima[0] - candidate.minima[0],
          candidate.maxima[1] - candidate.minima[1]
        ),
      });
    }
    this.candidate = null;
    this.refractoryUntil = time + 250;
    this.calibrationAfter = time + 750;
  }

  status(): ExploreStatus {
    const latestTime = this.size ? this.timeAt(this.size - 1) : null;
    return {
      baselineStable: this.stable,
      blinkEvents: this.events.map((event) => ({
        ...event,
        channels: [...event.channels],
      })),
      latestTime,
      supported: this.frontal.length === 2,
      bufferedDuration:
        latestTime === null
          ? 0
          : Math.min(
              BUFFER_MS,
              latestTime - this.timeAt(0) + 1000 / this.samplingRate
            ),
    };
  }

  private timeAt(index: number): number {
    return this.times[
      (this.cursor - this.size + this.capacity + index) % this.capacity
    ];
  }

  private valueAt(channel: number, index: number): number {
    return this.data[channel][
      (this.cursor - this.size + this.capacity + index) % this.capacity
    ];
  }

  /** Half-open [startTime, endTime), aligned to complete sample cells; never bridges missing data. */
  snapshot(
    startTime: number,
    endTime: number,
    channels = this.channels
  ): EEGSnapshot | null {
    const dt = 1000 / this.samplingRate;
    if (
      !this.size ||
      !Number.isFinite(startTime) ||
      !Number.isFinite(endTime) ||
      endTime <= startTime ||
      startTime < this.timeAt(0) - 0.01 ||
      endTime > this.timeAt(this.size - 1) + dt + 0.01 ||
      !channels.length ||
      new Set(channels).size !== channels.length ||
      channels.some((name) => !this.channels.includes(name))
    )
      return null;
    let lo = 0;
    let hi = this.size;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.timeAt(mid) < startTime - 0.01) lo = mid + 1;
      else hi = mid;
    }
    const first = lo;
    lo = first;
    hi = this.size;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.timeAt(mid) < endTime - 0.01) lo = mid + 1;
      else hi = mid;
    }
    const count = lo - first;
    if (!count) return null;
    let peakToPeak = 0;
    const data = channels.map((name) => {
      const index = this.channels.indexOf(name);
      let minimum = Infinity;
      let maximum = -Infinity;
      const values = Array.from({ length: count }, (_, offset) => {
        const value = this.valueAt(index, first + offset);
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
        return value;
      });
      peakToPeak = Math.max(peakToPeak, maximum - minimum);
      Object.freeze(values);
      return values;
    });
    Object.freeze(data);
    const ownedChannels = [...channels];
    Object.freeze(ownedChannels);
    return Object.freeze({
      data,
      channels: ownedChannels,
      samplingRate: this.samplingRate,
      startTime: this.timeAt(first),
      endTime: this.timeAt(first + count - 1) + dt,
      peakToPeak,
    });
  }

  /** Exhaustive sample-aligned five-second search, using monotone extrema queues in O(n). */
  comparison(): FrozenComparison | null {
    const length = Math.round((WINDOW_MS * this.samplingRate) / 1000);
    if (!this.events.length || this.frontal.length !== 2 || this.size < length)
      return null;
    const minima = [new Int32Array(this.size), new Int32Array(this.size)];
    const maxima = [new Int32Array(this.size), new Int32Array(this.size)];
    const minHead = [0, 0];
    const minTail = [0, 0];
    const maxHead = [0, 0];
    const maxTail = [0, 0];
    let calmIndex = -1;
    let blinkIndex = -1;
    let mostBlinks = 0;
    const windowCount = this.size - length + 1;
    const windowAmplitudes = new Float64Array(windowCount);
    const windowHasEvent = new Uint8Array(windowCount);
    let firstOverlap = 0;
    let firstContained = 0;
    let lastContained = 0;
    for (let end = 0; end < this.size; end++) {
      const start = end - length + 1;
      for (let ch = 0; ch < 2; ch++) {
        const { index } = this.frontal[ch];
        const value = this.valueAt(index, end);
        while (
          minTail[ch] > minHead[ch] &&
          this.valueAt(index, minima[ch][minTail[ch] - 1]) >= value
        )
          minTail[ch]--;
        while (
          maxTail[ch] > maxHead[ch] &&
          this.valueAt(index, maxima[ch][maxTail[ch] - 1]) <= value
        )
          maxTail[ch]--;
        minima[ch][minTail[ch]++] = end;
        maxima[ch][maxTail[ch]++] = end;
      }
      if (start < 0) continue;
      for (let ch = 0; ch < 2; ch++) {
        const { index } = this.frontal[ch];
        while (minHead[ch] < minTail[ch] && minima[ch][minHead[ch]] < start)
          minHead[ch]++;
        while (maxHead[ch] < maxTail[ch] && maxima[ch][maxHead[ch]] < start)
          maxHead[ch]++;
      }
      let amplitude = 0;
      for (let ch = 0; ch < 2; ch++) {
        const { index } = this.frontal[ch];
        amplitude = Math.max(
          amplitude,
          this.valueAt(index, maxima[ch][maxHead[ch]]) -
            this.valueAt(index, minima[ch][minHead[ch]])
        );
      }
      const startTime = this.timeAt(start);
      const endTime = this.timeAt(end) + 1000 / this.samplingRate;
      while (
        firstOverlap < this.events.length &&
        this.events[firstOverlap].endTime < startTime
      )
        firstOverlap++;
      const overlaps =
        firstOverlap < this.events.length &&
        this.events[firstOverlap].startTime < endTime;
      windowAmplitudes[start] = amplitude;
      windowHasEvent[start] = overlaps ? 1 : 0;
      while (
        firstContained < this.events.length &&
        this.events[firstContained].startTime < startTime
      )
        firstContained++;
      while (
        lastContained < this.events.length &&
        this.events[lastContained].endTime < endTime
      )
        lastContained++;
      const count = Math.max(0, lastContained - firstContained);
      if (count > mostBlinks) {
        mostBlinks = count;
        blinkIndex = start;
      }
    }
    if (blinkIndex >= 0) {
      const blinkEnd = blinkIndex + length - 1;
      let quietest = Infinity;
      for (let start = 0; start < windowCount; start++) {
        const calmEnd = start + length - 1;
        const disjoint = calmEnd < blinkIndex || start > blinkEnd;
        if (
          disjoint &&
          windowHasEvent[start] === 0 &&
          windowAmplitudes[start] > 0 &&
          windowAmplitudes[start] < quietest
        ) {
          calmIndex = start;
          quietest = windowAmplitudes[start];
        }
      }
    }
    if (calmIndex < 0 || blinkIndex < 0) return null;
    const calm = this.snapshot(
      this.timeAt(calmIndex),
      this.timeAt(calmIndex) + WINDOW_MS,
      FRONTAL
    );
    const blink = this.snapshot(
      this.timeAt(blinkIndex),
      this.timeAt(blinkIndex) + WINDOW_MS,
      FRONTAL
    );
    if (!calm || !blink) return null;
    const ratio = blink.peakToPeak / calm.peakToPeak;
    let sharedScale = 0;
    for (const snapshot of [calm, blink]) {
      for (const values of snapshot.data) {
        const mean =
          values.reduce((sum, value) => sum + value, 0) / values.length;
        for (const value of values)
          sharedScale = Math.max(sharedScale, Math.abs(value - mean));
      }
    }
    if (
      !Number.isFinite(ratio) ||
      !Number.isFinite(sharedScale) ||
      sharedScale <= 0
    )
      return null;
    return Object.freeze({ calm, blink, sharedScale, ratio });
  }

  /** Posterior Welch 8–12 Hz band power versus the preceding five seconds, not an alpha-rise prediction. */
  alphaRatio(startTime: number, endTime: number): number | null {
    if (this.samplingRate <= 24 || endTime - startTime < 1000) return null;
    const posterior = this.channels.filter((name) =>
      /^(?:TP9|TP10|(?:O|PO)(?:\d+|z))$/i.test(name)
    );
    if (!posterior.length) return null;
    const before = this.snapshot(startTime - WINDOW_MS, startTime, posterior);
    const during = this.snapshot(startTime, endTime, posterior);
    if (!before || !during) return null;
    const baseline = alphaPower(before);
    const power = alphaPower(during);
    if (baseline === null || power === null || baseline <= 1e-12) return null;
    const ratio = power / baseline;
    return Number.isFinite(ratio) ? ratio : null;
  }
}

/** One-second Hann-tapered, 50%-overlapping periodograms; normalize power, not interval length. */
function alphaPower(snapshot: EEGSnapshot): number | null {
  const length = Math.round(snapshot.samplingRate);
  if (snapshot.data[0].length < length) return null;
  const taper = new Float64Array(length);
  let taperEnergy = 0;
  for (let sample = 0; sample < length; sample++) {
    taper[sample] = 0.5 - 0.5 * Math.cos((2 * Math.PI * sample) / (length - 1));
    taperEnergy += taper[sample] ** 2;
  }
  let total = 0;
  let segments = 0;
  const firstBin = Math.ceil((8 * length) / snapshot.samplingRate);
  const lastBin = Math.floor((12 * length) / snapshot.samplingRate);
  for (const values of snapshot.data) {
    for (
      let start = 0;
      start + length <= values.length;
      start += Math.max(1, Math.floor(length / 2))
    ) {
      let mean = 0;
      for (let sample = 0; sample < length; sample++)
        mean += values[start + sample] / length;
      let power = 0;
      for (let bin = firstBin; bin <= lastBin; bin++) {
        const coefficient = 2 * Math.cos((2 * Math.PI * bin) / length);
        let previous = 0;
        let previous2 = 0;
        for (let sample = 0; sample < length; sample++) {
          const next =
            (values[start + sample] - mean) * taper[sample] +
            coefficient * previous -
            previous2;
          previous2 = previous;
          previous = next;
        }
        power += Math.max(
          0,
          previous ** 2 + previous2 ** 2 - coefficient * previous * previous2
        );
      }
      total += (2 * power) / (length * taperEnergy);
      segments++;
    }
  }
  const power = total / segments;
  return Number.isFinite(power) ? power : null;
}
