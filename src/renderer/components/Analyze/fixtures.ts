import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import type { Data as PlotlyData } from 'plotly.js';

/** One available cleaned EEG recording. */
export interface EegDatasetOption {
  key: string;
  text: string;
  value: string;
}

/** One available behavioral CSV. */
export interface BehaviorDatasetOption {
  key: string;
  text: string;
  value: string;
}

/** Condition summary row returned by Python get_epochs_info. */
export interface EpochInfoRow {
  name: string;
  value: number | string;
}

/** Supported behavior-plot display modes. */
export type DisplayMode = 'errorbars' | 'datapoints' | 'whiskers';

export const FACES_HOUSES_TITLE = 'Faces_Houses_3';
export const STROOP_TITLE = 'Stroop_2';

export const ANALYZE_STEPS = {
  OVERVIEW: 'OVERVIEW',
  ERP: 'ERP',
  BEHAVIOR: 'BEHAVIOR',
} as const;

export const ANALYZE_STEPS_BEHAVIOR = {
  BEHAVIOR: 'BEHAVIOR',
} as const;

export const MUSE_CHANNEL_INFO = ['TP9', 'AF7', 'AF8', 'TP10'];

export const EEG_DATASET_OPTIONS: EegDatasetOption[] = [
  { key: 'P01', text: 'P01-Faces_Houses_3-cleaned-epo.fif', value: '/workspaces/Faces_Houses_3/P01/P01-Faces_Houses_3-cleaned-epo.fif' },
  { key: 'P02', text: 'P02-Faces_Houses_3-cleaned-epo.fif', value: '/workspaces/Faces_Houses_3/P02/P02-Faces_Houses_3-cleaned-epo.fif' },
  { key: 'P03', text: 'P03-Faces_Houses_3-cleaned-epo.fif', value: '/workspaces/Faces_Houses_3/P03/P03-Faces_Houses_3-cleaned-epo.fif' },
];

export const BEHAVIOR_DATASET_OPTIONS: BehaviorDatasetOption[] = [
  { key: 'P01', text: 'P01-Faces_Houses_3_behavior.csv', value: '/workspaces/Faces_Houses_3/P01/P01-Faces_Houses_3_behavior.csv' },
  { key: 'P02', text: 'P02-Faces_Houses_3_behavior.csv', value: '/workspaces/Faces_Houses_3/P02/P02-Faces_Houses_3_behavior.csv' },
  { key: 'P03', text: 'P03-Faces_Houses_3_behavior.csv', value: '/workspaces/Faces_Houses_3/P03/P03-Faces_Houses_3_behavior.csv' },
];

export const EPOCHS_INFO: EpochInfoRow[] = [
  { name: 'Faces', value: 124 },
  { name: 'Houses', value: 118 },
  { name: 'Drop Percentage', value: '6.1%' },
  { name: 'Total Epochs', value: 242 },
];

/** Representative SVG for a PSD plot, the same MIME-bundle shape Pyodide returns. */
export const PSD_PLOT_MIME = {
  'image/svg+xml': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400"><rect width="800" height="400" fill="#ffffff"/><text x="400" y="30" text-anchor="middle" font-size="16" font-family="Lato, sans-serif" fill="#1a1a1a">Power Spectral Density — averaged over selected datasets</text><line x1="60" y1="330" x2="760" y2="330" stroke="#333" stroke-width="1"/><line x1="60" y1="330" x2="60" y2="50" stroke="#333" stroke-width="1"/><text x="400" y="365" text-anchor="middle" font-size="13" fill="#333">Frequency (Hz)</text><text x="20" y="190" transform="rotate(-90,20,190)" text-anchor="middle" font-size="13" fill="#333">Power (µV²/Hz)</text><polyline points="60,310 120,280 180,240 240,200 300,180 360,160 420,140 480,120 540,110 600,105 660,100 720,95 760,90" fill="none" stroke="#007c70" stroke-width="2"/><text x="700" y="80" font-size="12" fill="#007c70">Average PSD</text></svg>`,
};

/** Representative SVG for a topography plot. */
export const TOPO_PLOT_MIME = {
  'image/svg+xml': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500"><rect width="600" height="500" fill="#ffffff"/><text x="300" y="30" text-anchor="middle" font-size="16" font-family="Lato, sans-serif" fill="#1a1a1a">Topography — mean voltage across conditions</text><circle cx="300" cy="260" r="180" fill="#f5f5f5" stroke="#333" stroke-width="2"/><path d="M120 260h360M300 80v360" stroke="#999" stroke-width="1" stroke-dasharray="4"/><circle cx="160" cy="260" r="14" fill="#e6f2f1" stroke="#007c70" stroke-width="2"/><text x="160" y="265" text-anchor="middle" font-size="11" fill="#1a1a1a">T7</text><circle cx="440" cy="260" r="14" fill="#e6f2f1" stroke="#007c70" stroke-width="2"/><text x="440" y="265" text-anchor="middle" font-size="11" fill="#1a1a1a">T8</text><circle cx="300" cy="120" r="14" fill="#f0d9e6" stroke="#b34a93" stroke-width="2"/><text x="300" y="125" text-anchor="middle" font-size="11" fill="#1a1a1a">Fz</text><circle cx="300" cy="400" r="14" fill="#007c70" stroke="#333" stroke-width="2"/><text x="300" y="405" text-anchor="middle" font-size="11" fill="white">Pz</text><text x="500" y="470" font-size="12" fill="#007c70">● Active</text></svg>`,
};

/** Representative SVG for an ERP plot. */
export const ERP_PLOT_MIME = {
  'image/svg+xml': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480"><rect width="800" height="480" fill="#ffffff"/><text x="400" y="28" text-anchor="middle" font-size="16" font-family="Lato, sans-serif" fill="#1a1a1a">TP9 — Event-Related Potential by condition</text><line x1="80" y1="400" x2="720" y2="400" stroke="#333" stroke-width="1"/><line x1="80" y1="400" x2="80" y2="60" stroke="#333" stroke-width="1"/><text x="400" y="445" text-anchor="middle" font-size="13" fill="#333">Time (s)</text><text x="30" y="230" transform="rotate(-90,30,230)" text-anchor="middle" font-size="13" fill="#333">Amplitude (µV)</text><line x1="400" y1="60" x2="400" y2="400" stroke="#999" stroke-width="1" stroke-dasharray="4"/><polyline points="80,340 140,320 200,330 260,300 320,220 380,180 440,200 500,250 560,300 620,330 680,340 720,345" fill="none" stroke="#007cc4" stroke-width="2"/><polyline points="80,360 140,340 200,350 260,330 320,280 380,260 440,270 500,300 560,330 620,350 680,355 720,358" fill="none" stroke="#f39c12" stroke-width="2"/><text x="560" y="100" font-size="12" fill="#007cc4">● Faces</text><text x="560" y="120" font-size="12" fill="#f39c12">● Houses</text></svg>`,
};

/** Stable condition labels for display. */
export const CONDITION_LABELS: Record<number, string> = {
  1: 'Faces',
  2: 'Houses',
};

export interface ConditionSummary {
  code: number;
  label: string;
  count: number;
  color: string;
}

export const CONDITION_SUMMARIES: ConditionSummary[] = [
  { code: 1, label: 'Faces', count: 124, color: cssColorForIndex(0) },
  { code: 2, label: 'Houses', count: 118, color: cssColorForIndex(1) },
];

/** Behavior plot fixtures matching the shape returned by aggregateDataForPlot. */
export const RT_ERRORBAR_PLOT: { dataToPlot: PlotlyData[]; layout: Record<string, unknown> } = {
  dataToPlot: [
    {
      x: ['P01', 'P02', 'P03'],
      y: [482, 521, 505],
      name: '1',
      type: 'bar',
      marker: { color: '#28619E', size: 7 },
      error_y: { type: 'data', array: [23, 31, 19], visible: true },
    },
    {
      x: ['P01', 'P02', 'P03'],
      y: [512, 548, 533],
      name: '2',
      type: 'bar',
      marker: { color: '#3DBBDB', size: 7 },
      error_y: { type: 'data', array: [27, 35, 22], visible: true },
    },
  ],
  layout: {
    yaxis: { title: 'Response Time (milliseconds)', zeroline: false, range: [0, 700] },
    barmode: 'group',
    title: 'Response Time',
  },
};

export const ACCURACY_ERRORBAR_PLOT: { dataToPlot: PlotlyData[]; layout: Record<string, unknown> } = {
  dataToPlot: [
    {
      x: ['P01', 'P02', 'P03'],
      y: [94, 91, 96],
      name: '1',
      type: 'bar',
      marker: { color: '#28619E', size: 7 },
      error_y: { type: 'data', array: [2.1, 2.8, 1.5], visible: true },
    },
    {
      x: ['P01', 'P02', 'P03'],
      y: [89, 87, 92],
      name: '2',
      type: 'bar',
      marker: { color: '#3DBBDB', size: 7 },
      error_y: { type: 'data', array: [2.5, 3.1, 1.9], visible: true },
    },
  ],
  layout: {
    yaxis: { title: '% correct', zeroline: false, range: [0, 105] },
    barmode: 'group',
    title: 'Accuracy',
  },
};

export const EMPTY_BEHAVIOR_PLOT: { dataToPlot: PlotlyData[]; layout: Record<string, unknown> } = {
  dataToPlot: [],
  layout: { title: 'Response Time' },
};

export interface AnalyzeWorkspaceProps {
  title: string;
  type: EXPERIMENTS;
  deviceType: DEVICES;
  isEEGEnabled: boolean;
}
