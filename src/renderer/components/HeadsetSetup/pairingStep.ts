import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
} from '../../constants/constants';
import type { PairingStep } from './HeadsetSetup';

/** Screens the student moves through by hand; `discovery` hands over to device state. */
export type SetupScreen = 'choose' | 'wear' | 'ready' | 'discovery';

export interface PairingInputs {
  screen: SetupScreen;
  /** LSL lists streams from its own discovery, not Bluetooth availability. */
  isLSL: boolean;
  availability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  lslSearching: boolean;
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
  const searching = i.isLSL
    ? i.lslSearching
    : i.availability === DEVICE_AVAILABILITY.SEARCHING;
  if (searching) return 'searching';
  if (i.connectionStatus === CONNECTION_STATUS.DISCONNECTED) return 'failed';
  const listed = i.isLSL || i.availability === DEVICE_AVAILABILITY.AVAILABLE;
  return listed && i.foundCount ? 'found' : 'notFound';
}
