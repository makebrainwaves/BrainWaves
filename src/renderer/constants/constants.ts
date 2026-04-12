export enum EXPERIMENTS {
  NONE = 'NONE',
  N170 = 'Faces and Houses',
  STROOP = 'Stroop Task',
  MULTI = 'Multi-tasking',
  SEARCH = 'Visual Search',
  CUSTOM = 'Custom',
  // P300 = 'Visual Oddball',
  // SSVEP = 'Steady-state Visual Evoked Potential',
}

export const SCREENS = {
  HOME: { route: '/', title: 'HOME', order: 0 },
  BANK: { route: '/home', title: 'HOME', order: 0 },
  DESIGN: { route: '/design', title: 'REVIEW DESIGN', order: 1 },
  COLLECT: { route: '/collect', title: 'COLLECT', order: 2 },
  RUN: { route: '/run', title: 'RUN', order: 5 },
  CLEAN: { route: '/clean', title: 'CLEAN', order: 3 },
  ANALYZE: { route: '/analyze', title: 'ANALYZE', order: 4 },
  ANALYZEBEHAVIOR: { route: '/analyze', title: 'ANALYZE', order: 3 },
} as const;

export enum DEVICES {
  NONE = 'NONE',
  MUSE = 'MUSE',
  GANGLION = 'GANGLION', // One day ;)
}

export enum CONNECTION_STATUS {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  NO_DEVICES = 'NO_DEVICES',
  NOT_YET_CONNECTED = 'NOT_YET_CONNECTED',
  SEARCHING = 'SEARCHING',
  BLUETOOTH_DISABLED = 'BLUETOOTH_DISABLED',
}

export enum DEVICE_AVAILABILITY {
  NONE = 'NONE',
  SEARCHING = 'SEARCHING',
  AVAILABLE = 'AVAILABLE',
}

// Names of variables in pyodide
export enum PYODIDE_VARIABLE_NAMES {
  RAW_EPOCHS = 'raw_epochs',
  CLEAN_EPOCHS = 'clean_epochs',
}

export const SEARCH_TIMER = 3000;

// NOTE: TARGET/NONTARGET are intentional semantic aliases for STIMULUS_2/STIMULUS_1
// because the actual marker id values of stimulus 1 and 2 are reversed.
export enum EVENTS {
  STIMULUS_1 = 1,
  STIMULUS_2 = 2,
  STIMULUS_3 = 3,
  STIMULUS_4 = 4,
  /* eslint-disable @typescript-eslint/no-duplicate-enum-values */
  TARGET = 2,
  NONTARGET = 1,
  /* eslint-enable @typescript-eslint/no-duplicate-enum-values */
}

export const CHANNELS = {
  // Muse channels
  TP9: { index: 0, color: '#9B6ABC' },
  AF7: { index: 1, color: '#7EA0C5' },
  AF8: { index: 2, color: '#8BD6E9' },
  TP10: { index: 3, color: '#66B0A9' },
  AUX: { index: 4, color: '#E7789E' },
} as const;

export const MUSE_CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'];

export const ZOOM_SCALAR = 1.5;
export const MUSE_SAMPLING_RATE = 256;

export const PLOTTING_INTERVAL = 250; // ms

export const VIEWER_DEFAULTS = {
  domain: 5000, // ms
  zoom: 1,
  autoScale: false,
} as const;

export enum SIGNAL_QUALITY {
  BAD = '#ed5a5a',
  OK = '#FFCD39',
  GREAT = '#66B0A9',
  DISCONNECTED = '#BFBFBF',
}

export enum SIGNAL_QUALITY_THRESHOLDS {
  BAD = 15,
  OK = 10,
  GREAT = 1.5, // Below 1.5 usually indicates not connected to anything
}

export enum FILE_TYPES {
  STIMULUS_DIR = 'STIMULUS_DIR',
  TIMELINE = 'TIMELINE',
}

// Injected synchronously by the preload script via additionalArguments.
// In dev: points to src/renderer/. In prod: points to process.resourcesPath.

export const RESOURCE_PATH: string =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__ELECTRON_RESOURCE_PATH__ || ''; // Injected by Electron preload additionalArguments — not typed

/** Node `process.platform` from preload; empty outside Electron. */
export const ELECTRON_PLATFORM: string =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__ELECTRON_PLATFORM__ || '';
