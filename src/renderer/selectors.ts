import { CONNECTION_STATUS } from './constants/constants';
import type { RootState } from './store';

/**
 * A run records EEG only with EEG on and a headset connected; "Continue
 * anyway" without one records key presses alone.
 */
export const selectRecordsEEG = (state: RootState) =>
  state.experiment.isEEGEnabled &&
  state.device.connectionStatus === CONNECTION_STATUS.CONNECTED;
