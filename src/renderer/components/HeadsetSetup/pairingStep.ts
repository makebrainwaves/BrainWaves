import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
} from '../../constants/constants';
import type { PairingStep } from './HeadsetSetup';

/** Screens the student moves through by hand; `discovery` hands over to device state. */
export type SetupScreen = 'choose' | 'wear' | 'ready' | 'discovery';

export interface PairingInputs {
  screen: SetupScreen;
  /** Bluetooth and LSL discovery share it: the reducer moves both through SEARCHING. */
  availability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  /** Headsets or EEG streams currently listable. */
  foundCount: number;
}

/**
 * The pairing screen to show. A live connection always wins; before the
 * student presses search their own screen wins; after that Redux device state
 * decides. A new search outranks a previous failed connect.
 */
export function pairingStep(i: PairingInputs): PairingStep {
  if (i.connectionStatus === CONNECTION_STATUS.CONNECTED) return 'connected';
  if (i.screen !== 'discovery') return i.screen;
  if (i.connectionStatus === CONNECTION_STATUS.CONNECTING) return 'connecting';
  if (i.availability === DEVICE_AVAILABILITY.SEARCHING) return 'searching';
  if (i.connectionStatus === CONNECTION_STATUS.DISCONNECTED) return 'failed';
  return i.availability === DEVICE_AVAILABILITY.AVAILABLE && i.foundCount
    ? 'found'
    : 'notFound';
}
