/** A repeatable work area inside a workspace. Order here is display order. */
export type Area = 'prepare' | 'collect' | 'clean' | 'analyze';

/** Behavior-only workspaces record key presses, no EEG, and have no Clean area. */
export type Modality = 'eeg' | 'behavior';

export interface ShellWorkspace {
  name: string;
  /** Template display name, e.g. `Faces/Houses`. */
  experimentType: string;
  modality: Modality;
}

/** What the headset chip reports. Never implies recording — only the run bar does. */
export type DeviceState = 'none' | 'connected' | 'fixture';

export interface RunState {
  kind: Modality;
  /** Preformatted elapsed time, e.g. `02:14`. */
  elapsed: string;
  /** Preformatted progress, e.g. `Trial 34 of 120`. Omitted when the runtime reports no trial count. */
  progress?: string;
}

/** `Faces/Houses · EEG`, `Stroop · Behavior only`. */
export const workspaceTypeLabel = ({
  experimentType,
  modality,
}: Pick<ShellWorkspace, 'experimentType' | 'modality'>) =>
  `${experimentType} · ${modality === 'eeg' ? 'EEG' : 'Behavior only'}`;
