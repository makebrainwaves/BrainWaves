import type { Data as PlotlyData } from 'plotly.js';
import type { EpochArraysMeta } from '../../actions';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import { epochChannelSeries, meanTrace } from '../CleanComponent/epochArrays';

/** A dataset option, shaped like `AnalyzeComponent`'s `{ key, text, value }` dropdown entries. */
export interface DatasetOption {
  key: string;
  text: string;
  value: string;
}

/** One row of Python `get_epochs_info`: `{ name, value }` after the reducer flattens it. */
export interface EpochInfoRow {
  name: string;
  value: number | string;
}

/** `aggregateDataForPlot`'s return shape. */
export interface BehaviorPlot {
  dataToPlot: PlotlyData[];
  layout: Record<string, unknown>;
}

/** Epoch arrays exactly as `pyodide.epochArrays` holds them (utils.py `get_epochs_arrays`). */
export interface EpochArrays {
  buffer: ArrayBuffer;
  meta: EpochArraysMeta;
}

export const WORKSPACE_TITLE = 'Faces_Houses_3';

export const MUSE_CHANNEL_INFO = ['TP9', 'AF7', 'AF8', 'TP10'];

/** Faces/Houses marker registry: `Face` = STIMULUS_1, `House` = STIMULUS_2. */
export const FACES_HOUSES_CODE_TO_LABEL: Record<number, string> = {
  1: 'Face',
  2: 'House',
};

/** Where `readWorkspace*Data` finds a participant's files. */
const WORKSPACE_DATA_DIR = `/Users/student/BrainWaves_Workspaces/${WORKSPACE_TITLE}/Data`;

export const EEG_DATASET_OPTIONS: DatasetOption[] = ['P01', 'P02', 'P03'].map(
  (subject) => {
    const name = `${subject}-cleaned-epo.fif`;
    return {
      key: name,
      text: name,
      value: `${WORKSPACE_DATA_DIR}/${subject}/EEG/${name}`,
    };
  }
);

export const BEHAVIOR_DATASET_OPTIONS: DatasetOption[] = [
  'P01',
  'P02',
  'P03',
  'P04',
].map((subject) => {
  const name = `${subject}-1-1-behavior.csv`;
  return {
    key: name,
    text: name,
    value: `${WORKSPACE_DATA_DIR}/${subject}/Behavior/${name}`,
  };
});

const SAMPLING_RATE = 256;
const T_MIN = -0.1;
const T_MAX = 0.8;
const TRIALS_PER_CONDITION = 40;

/** Deterministic PRNG so every screenshot of the example data is identical. */
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

/**
 * Example Faces/Houses epochs for one participant: 40 trials per condition on
 * the four Muse channels, -100…800 ms at 256 Hz, in µV and baseline-corrected
 * the way `load_data` + epoching leave them. Each trial is background rhythm
 * and sensor noise plus a small evoked response whose ~170 ms dip is deeper
 * for faces on the ear-side sensors. Synthetic, not recorded.
 */
function buildExampleEpochs(): EpochArrays {
  const random = mulberry32(170);
  const nTimes = Math.round((T_MAX - T_MIN) * SAMPLING_RATE) + 1;
  const times = Array.from(
    { length: nTimes },
    (_, i) => T_MIN + i / SAMPLING_RATE
  );
  const codes = [
    ...Array<number>(TRIALS_PER_CONDITION).fill(1),
    ...Array<number>(TRIALS_PER_CONDITION).fill(2),
  ];
  for (let i = codes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [codes[i], codes[j]] = [codes[j], codes[i]];
  }
  const posteriorWeight = [1, 0.35, 0.35, 1];
  const nChannels = MUSE_CHANNEL_INFO.length;
  const data = new Float32Array(codes.length * nChannels * nTimes);
  const baselineEnd = times.findIndex((t) => t >= 0);

  codes.forEach((code, epoch) => {
    const n170 = code === 1 ? -5.5 : -2;
    const latency = (random() - 0.5) * 0.02;
    const gain = 0.7 + random() * 0.6;
    for (let ch = 0; ch < nChannels; ch += 1) {
      const alphaPhase = random() * Math.PI * 2;
      const thetaPhase = random() * Math.PI * 2;
      const alphaAmp = 2 + random() * 4;
      const thetaAmp = 1 + random() * 3;
      const offset = (epoch * nChannels + ch) * nTimes;
      for (let i = 0; i < nTimes; i += 1) {
        const t = times[i] - latency;
        const evoked =
          gain *
          posteriorWeight[ch] *
          (3 * bump(t, 0.1, 0.022) +
            n170 * bump(t, 0.17, 0.028) +
            2 * bump(t, 0.36, 0.08));
        data[offset + i] =
          evoked +
          alphaAmp * Math.sin(2 * Math.PI * 10 * times[i] + alphaPhase) +
          thetaAmp * Math.sin(2 * Math.PI * 5 * times[i] + thetaPhase) +
          (random() - 0.5) * 7;
      }
      let baseline = 0;
      for (let i = 0; i < baselineEnd; i += 1) baseline += data[offset + i];
      baseline /= baselineEnd;
      for (let i = 0; i < nTimes; i += 1) data[offset + i] -= baseline;
    }
  });

  return {
    buffer: data.buffer,
    meta: {
      n_epochs: codes.length,
      n_channels: nChannels,
      n_times: nTimes,
      ch_names: MUSE_CHANNEL_INFO,
      times,
      event_codes: codes,
    },
  };
}

/** Example cleaned epochs for P01, feeding the ERP walkthrough and plot fixtures (synthetic). */
export const EXAMPLE_EPOCH_ARRAYS = buildExampleEpochs();

/** Epochs dropped in cleaning, for the example's `Drop Percentage`. */
const DROPPED_EPOCHS = 4;

/** `get_epochs_info(clean_epochs)` for the example epochs. */
export const EPOCHS_INFO: EpochInfoRow[] = [
  { name: 'Face', value: TRIALS_PER_CONDITION },
  { name: 'House', value: TRIALS_PER_CONDITION },
  {
    name: 'Drop Percentage',
    value:
      Math.round(
        (10000 * DROPPED_EPOCHS) / (2 * TRIALS_PER_CONDITION + DROPPED_EPOCHS)
      ) / 100,
  },
  { name: 'Total Epochs', value: 2 * TRIALS_PER_CONDITION + DROPPED_EPOCHS },
];

const CONDITIONS = Object.entries(FACES_HOUSES_CODE_TO_LABEL).map(
  ([code, label], index) => ({
    label,
    epochs: EXAMPLE_EPOCH_ARRAYS.meta.event_codes.flatMap((c, i) =>
      c === Number(code) ? [i] : []
    ),
    color: cssColorForIndex(index),
  })
);

const polyline = (
  values: ArrayLike<number>,
  x: (i: number) => number,
  y: (v: number) => number
) =>
  Array.from(values, (v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(
    ' '
  );

/**
 * Representative `plot_conditions` output (utils.py) for one channel: the
 * condition means of the example epochs with a ±2 SEM band, as an SVG MIME
 * bundle like the worker returns.
 */
export function erpPlotMime(channel: string): { 'image/svg+xml': string } {
  const { buffer, meta } = EXAMPLE_EPOCH_ARRAYS;
  const ch = meta.ch_names.indexOf(channel);
  const [W, H, L, R, T, B] = [720, 440, 76, 24, 44, 60];
  const x = (i: number) => L + (i / (meta.n_times - 1)) * (W - L - R);
  const y = (v: number) => T + ((8 - v) / 16) * (H - T - B);
  const series = CONDITIONS.map(({ label, epochs, color }) => {
    const mean = meanTrace(buffer, meta, epochs, ch);
    const sem = new Float32Array(meta.n_times);
    for (const e of epochs) {
      const s = epochChannelSeries(buffer, meta, e, ch);
      for (let t = 0; t < meta.n_times; t += 1) sem[t] += (s[t] - mean[t]) ** 2;
    }
    for (let t = 0; t < meta.n_times; t += 1) {
      sem[t] = Math.sqrt(sem[t] / (epochs.length - 1) / epochs.length);
    }
    const upper = polyline(
      mean.map((m, t) => m + 2 * sem[t]),
      x,
      y
    );
    const lower = Array.from(mean, (m, t) => [x(t), y(m - 2 * sem[t])])
      .reverse()
      .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
      .join(' ');
    return `<polygon points="${upper} ${lower}" fill="${color}" fill-opacity="0.3"/><polyline points="${polyline(mean, x, y)}" fill="none" stroke="${color}" stroke-width="2"/>`;
  }).join('');
  const zeroX = x(meta.times.findIndex((t) => t >= 0));
  const ticks = [-0.1, 0, 0.2, 0.4, 0.6, 0.8]
    .map((s) => {
      const tx = L + ((s - T_MIN) / (T_MAX - T_MIN)) * (W - L - R);
      return `<line x1="${tx}" y1="${H - B}" x2="${tx}" y2="${H - B + 5}" stroke="#333"/><text x="${tx}" y="${H - B + 20}" text-anchor="middle" font-size="13">${s.toFixed(1)}</text>`;
    })
    .join('');
  const yTicks = [-8, -4, 0, 4, 8]
    .map(
      (v) =>
        `<line x1="${L - 5}" y1="${y(v)}" x2="${L}" y2="${y(v)}" stroke="#333"/><text x="${L - 9}" y="${y(v) + 4}" text-anchor="end" font-size="13">${v}</text>`
    )
    .join('');
  const legend = CONDITIONS.map(
    ({ label, color }, i) =>
      `<line x1="${W - 150}" y1="${T + 14 + i * 22}" x2="${W - 124}" y2="${T + 14 + i * 22}" stroke="${color}" stroke-width="2"/><text x="${W - 116}" y="${T + 19 + i * 22}" font-size="14">${label}</text>`
  ).join('');
  return {
    'image/svg+xml': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="DejaVu Sans, sans-serif" fill="#1a1a1a"><rect width="${W}" height="${H}" fill="#fff"/><text x="${(W + L) / 2}" y="26" text-anchor="middle" font-size="16">${channel}</text>${series}<line x1="${zeroX}" y1="${T}" x2="${zeroX}" y2="${H - B}" stroke="#000"/><line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="#333"/><line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="#333"/>${ticks}${yTicks}<text x="${(W + L) / 2}" y="${H - 14}" text-anchor="middle" font-size="14">Time (s)</text><text x="20" y="${(H - B + T) / 2}" transform="rotate(-90 20 ${(H - B + T) / 2})" text-anchor="middle" font-size="14">Amplitude (uV)</text>${legend}</svg>`,
  };
}

/** Where MNE's topo layout puts each Muse sensor, as fractions of the head box. */
const TOPO_POSITIONS: Record<string, [number, number]> = {
  AF7: [0.3, 0.2],
  AF8: [0.7, 0.2],
  TP9: [0.14, 0.62],
  TP10: [0.86, 0.62],
};

/**
 * Representative `plot_topo` output (MNE `plot_evoked_topo`): one small ERP
 * per sensor at its place on the head, one line per condition in
 * `conditionPalette` order, legend text in the condition colors.
 */
function buildTopoSvg(): string {
  const { buffer, meta } = EXAMPLE_EPOCH_ARRAYS;
  const [W, H, boxW, boxH] = [640, 520, 150, 92];
  const panels = meta.ch_names
    .map((name, ch) => {
      const [fx, fy] = TOPO_POSITIONS[name];
      const left = 40 + fx * (W - 80) - boxW / 2;
      const top = 60 + fy * (H - 120) - boxH / 2;
      const x = (i: number) => left + (i / (meta.n_times - 1)) * boxW;
      const y = (v: number) => top + boxH / 2 - (v / 8) * (boxH / 2);
      const zeroX = x(meta.times.findIndex((t) => t >= 0));
      const lines = CONDITIONS.map(
        ({ epochs, color }) =>
          `<polyline points="${polyline(meanTrace(buffer, meta, epochs, ch), x, y)}" fill="none" stroke="${color}" stroke-width="2"/>`
      ).join('');
      return `<rect x="${left}" y="${top}" width="${boxW}" height="${boxH}" fill="none" stroke="#bbb"/><line x1="${left}" y1="${top + boxH / 2}" x2="${left + boxW}" y2="${top + boxH / 2}" stroke="#ddd"/><line x1="${zeroX}" y1="${top}" x2="${zeroX}" y2="${top + boxH}" stroke="#ddd"/>${lines}<text x="${left + 4}" y="${top + 14}" font-size="12">${name}</text>`;
    })
    .join('');
  const legend = CONDITIONS.map(
    ({ label, color }, i) =>
      `<text x="${W - 24}" y="${40 + i * 24}" text-anchor="end" font-size="20" fill="${color}">${label}</text>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="DejaVu Sans, sans-serif" fill="#1a1a1a"><ellipse cx="${W / 2}" cy="${H / 2 + 20}" rx="${W / 2 - 70}" ry="${H / 2 - 50}" fill="none" stroke="#999" stroke-width="2"/><path d="M${W / 2 - 22} ${70} L${W / 2} ${42} L${W / 2 + 22} ${70}" fill="none" stroke="#999" stroke-width="2"/>${panels}${legend}<text x="24" y="${H - 16}" font-size="12" fill="#666">each box: -0.1 to 0.8 s, ±8 µV</text></svg>`;
}

/** Topography MIME bundle (`pyodide.topoPlot`). */
export const TOPO_PLOT_MIME = { 'image/svg+xml': buildTopoSvg() };

/** Representative PSD MIME bundle (`pyodide.psdPlot`). */
export const PSD_PLOT_MIME = {
  'image/svg+xml': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400"><rect width="800" height="400" fill="#ffffff"/><text x="400" y="30" text-anchor="middle" font-size="16" font-family="Lato, sans-serif" fill="#1a1a1a">Power Spectral Density — averaged over selected datasets</text><line x1="60" y1="330" x2="760" y2="330" stroke="#333" stroke-width="1"/><line x1="60" y1="330" x2="60" y2="50" stroke="#333" stroke-width="1"/><text x="400" y="365" text-anchor="middle" font-size="13" fill="#333">Frequency (Hz)</text><text x="20" y="190" transform="rotate(-90,20,190)" text-anchor="middle" font-size="13" fill="#333">Power (µV²/Hz)</text><polyline points="60,310 120,280 180,240 240,200 300,180 360,160 420,140 480,120 540,110 600,105 660,100 720,95 760,90" fill="none" stroke="#007c70" stroke-width="2"/><text x="700" y="80" font-size="12" fill="#007c70">Average PSD</text></svg>`,
};

/** A behavior CSV as `readBehaviorData` returns it: Papa.parse output plus `meta.datafile`. */
export interface BehaviorCsv {
  data: Record<string, string>[];
  meta: { fields: string[]; datafile: string };
}

/**
 * Example Faces/Houses behavior CSVs keyed by path, rows as strings like
 * every value after the CSV round-trip. Feed them to the real
 * `aggregateDataForPlot`; faces are answered a little faster on average.
 */
export const BEHAVIOR_CSVS: Record<string, BehaviorCsv> = Object.fromEntries(
  BEHAVIOR_DATASET_OPTIONS.map((option, p) => {
    const random = mulberry32(900 + p);
    const data = Array.from({ length: 60 }, (_, i) => {
      const face = i % 2 === 0;
      const normal = (random() + random() + random() - 1.5) * 2;
      const reactionTime =
        (face ? 470 : 515) + p * 18 + normal * 70 + (random() < 0.04 ? 600 : 0);
      return {
        trial_number: String(i + 1),
        phase: 'main',
        condition: face ? 'Face' : 'House',
        reaction_time: reactionTime.toFixed(0),
        correct_response: String(random() > (face ? 0.06 : 0.1)),
        response_given: 'yes',
      };
    });
    return [
      option.value,
      { data, meta: { fields: Object.keys(data[0]), datafile: option.value } },
    ];
  })
);
