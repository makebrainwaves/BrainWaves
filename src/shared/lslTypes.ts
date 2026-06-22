/**
 * Shared LSL types. Imported by both src/main/lsl/ and src/renderer/.
 */

export interface LSLEpoch {
  deviceId: string;
  deviceType: 'muse' | 'neurosity';
  /** [sampleIndex][channelIndex], µV */
  samples: number[][];
  /** one per sample (ms, performance.now()) */
  timestamps: number[];
  channelNames: string[];
  sampleRate: number;
}

export interface LSLMarker {
  /** e.g. 'stimulus_onset', '1', '2' */
  label: string;
  /** performance.now() at event time */
  rendererTimestamp: number;
}

export interface DiscoveredStream {
  uid: string;
  name: string;
  /** 'EEG', 'Markers', etc. */
  type: string;
  channelCount: number;
  sampleRate: number;
  sourceId: string;
}

export interface LSLInletEpoch {
  uid: string;
  samples: number[][];
  timestamps: number[];
}

export type LSLStatusKind =
  | 'outlet-error'
  | 'marker-error'
  | 'discovery-error'
  | 'inlet-error';

/**
 * Emitted from the main process when an LSL operation fails. The renderer
 * surfaces these as user-visible toasts so silent failures in the native FFI
 * layer don't go unnoticed during an experiment.
 */
export interface LSLStatus {
  kind: LSLStatusKind;
  message: string;
}
