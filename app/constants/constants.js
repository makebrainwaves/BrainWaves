export const EXPERIMENTS = {
  NONE: 'NONE',
  P300: 'Visual Oddball',
  N170: 'Faces and Houses',
  SSVEP: 'Steady-state Visual Evoked Potential',
  STROOP: 'Stroop Task',
  MULTI: 'Multi-tasking',
  SEARCH: 'Visual search',
  CUSTOM: 'Custom'
};

export const SCREENS = {
  HOME: { route: '/', title: 'HOME', order: 0 },
  DESIGN: { route: '/design', title: 'REVIEW DESIGN', order: 1 },
  COLLECT: { route: '/collect', title: 'COLLECT', order: 2 },
  RUN: { route: '/run', title: 'RUN', order: 5 },
  CLEAN: { route: '/clean', title: 'CLEAN', order: 3 },
  ANALYZE: { route: '/analyze', title: 'ANALYZE', order: 4 },
  ANALYZEBEHAVIOR: { route: '/analyze', title: 'ANALYZE', order: 3 }
};

export const DEVICES = {
  NONE: 'NONE',
  MUSE: 'MUSE',
  EMOTIV: 'EMOTIV',
  GANGLION: 'GANGLION' // One day ;)
};

export const CONNECTION_STATUS = {
  CONNECTED: 'CONNECTED',
  CONNECTING: 'CONNECTING',
  DISCONNECTED: 'DISCONNECTED',
  NO_DEVICES: 'NO_DEVICES',
  NOT_YET_CONNECTED: 'NOT_YET_CONNECTED',
  SEARCHING: 'SEARCHING',
  BLUETOOTH_DISABLED: 'BLUETOOTH_DISABLED'
};

export const KERNEL_STATUS = {
  OFFLINE: 'Offline',
  BUSY: 'Busy',
  IDLE: 'Idle',
  STARTING: 'Starting'
};

export const DEVICE_AVAILABILITY = {
  NONE: 'NONE',
  SEARCHING: 'SEARCHING',
  AVAILABLE: 'AVAILABLE'
};

// Names of variables in the jupyter kernel
export const JUPYTER_VARIABLE_NAMES = {
  RAW_EPOCHS: 'raw_epochs',
  CLEAN_EPOCHS: 'clean_epochs'
};

export const SEARCH_TIMER = 3000;

// NOTE: the actual marker id values of stimulus 1 and 2 are reversed
export const EVENTS = {
  STIMULUS_1: 2,
  STIMULUS_2: 1,
  TARGET: 2,
  NONTARGET: 1
};

export const CHANNELS = {
  // Epoc channels
  AF3: { index: 0, color: '#9B6ABC' },
  F7: { index: 1, color: '#7EA0C5' },
  F3: { index: 2, color: '#8BD6E9' },
  FC5: { index: 3, color: '#66B0A9' },
  T7: { index: 4, color: '#E7789E' },
  P7: { index: 5, color: '#F1A766' },
  O1: { index: 6, color: '#FFDA6A' },
  O2: { index: 7, color: '#F8F8F8' },
  P8: { index: 8, color: '#F8F8F8' },
  T8: { index: 9, color: '#F8F8F8' },
  FC6: { index: 10, color: '#F8F8F8' },
  F4: { index: 11, color: '#F8F8F8' },
  F8: { index: 12, color: '#F8F8F8' },
  AF4: { index: 13, color: '#F8F8F8' },
  // Muse channels
  TP9: { index: 0, color: '#9B6ABC' },
  AF7: { index: 1, color: '#7EA0C5' },
  AF8: { index: 2, color: '#8BD6E9' },
  TP10: { index: 3, color: '#66B0A9' },
  AUX: { index: 4, color: '#E7789E' }
};

export const EMOTIV_CHANNELS = [
  'AF3',
  'F7',
  'F3',
  'FC5',
  'T7',
  'P7',
  'O1',
  'O2',
  'P8',
  'T8',
  'FC6',
  'F4',
  'F8',
  'AF4'
];

export const MUSE_CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'];

export const ZOOM_SCALAR = 1.5;
export const MUSE_SAMPLING_RATE = 256;

export const PLOTTING_INTERVAL = 250; // ms

export const VIEWER_DEFAULTS = {
  domain: 5000, // ms
  zoom: 1,
  autoScale: false
};

export const SIGNAL_QUALITY = {
  BAD: '#ed5a5a',
  OK: '#FFCD39',
  GREAT: '#66B0A9',
  DISCONNECTED: '#BFBFBF'
};

export const SIGNAL_QUALITY_THRESHOLDS = {
  BAD: 15,
  OK: 10,
  GREAT: 1.5 // Below 1.5 usually indicates not connected to anything
};

export const FILE_TYPES = {
  STIMULUS_DIR: 'STIMULUS_DIR',
  TIMELINE: 'TIMELINE'
};
