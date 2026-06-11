/**
 * EEG driver registry + unified marker dispatch.
 *
 * deviceEpics looks up the active driver by `deviceType` here instead of
 * branching on MUSE vs NEUROSITY everywhere. Adding a device means registering
 * one entry — and, because the EEGDriver interface requires injectMarker, a new
 * device cannot ship without a marker path (the gap that broke Neurosity ERPs).
 *
 * LSL inlet recording is a separate mode with its own discovery/connect epics,
 * so it is not in this registry; injectMarker() no-ops for LSL because an
 * external recorder owns markers in that mode.
 */
import { DEVICES } from '../../constants/constants';
import { EEGDriver } from './types';
import { museDriver } from './muse';
import { neurosityDriver } from './neurosity';

const DRIVERS: Partial<Record<DEVICES, EEGDriver>> = {
  [DEVICES.MUSE]: museDriver,
  [DEVICES.NEUROSITY]: neurosityDriver,
};

/** Returns the driver for a built-in (BLE) device type, or throws if none. */
export const getDriver = (deviceType: DEVICES): EEGDriver => {
  const driver = DRIVERS[deviceType];
  if (!driver) {
    throw new Error(`No EEG driver registered for device type: ${deviceType}`);
  }
  return driver;
};

// The driver of the currently-connected device, used by the device-agnostic
// injectMarker() dispatcher so the UI doesn't need to know the device type.
let activeDriver: EEGDriver | null = null;

/** Set (on connect) or clear (on disconnect) the active driver. */
export const setActiveDriver = (deviceType: DEVICES | null): void => {
  activeDriver = deviceType ? (DRIVERS[deviceType] ?? null) : null;
};

/**
 * Device-agnostic marker injection. Called by the experiment runner; delegates
 * to whichever driver is connected. No-ops when no first-party device is active
 * (e.g. LSL mode, or before connect), matching prior fire-and-forget behaviour.
 */
export const injectMarker = (code: number, time: number): void => {
  activeDriver?.injectMarker(code, time);
};

export type { EEGDriver } from './types';
