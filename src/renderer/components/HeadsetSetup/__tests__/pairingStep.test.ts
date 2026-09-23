import { describe, expect, it } from 'vitest';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
} from '../../../constants/constants';
import { PairingInputs, pairingStep } from '../pairingStep';

const base: PairingInputs = {
  screen: 'discovery',
  isLSL: false,
  availability: DEVICE_AVAILABILITY.NONE,
  connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
  lslSearching: false,
  foundCount: 0,
};

describe('pairingStep', () => {
  it('shows connected whenever a device is connected, even when reopened from the chip', () => {
    expect(
      pairingStep({
        ...base,
        screen: 'choose',
        connectionStatus: CONNECTION_STATUS.CONNECTED,
      })
    ).toBe('connected');
  });

  it('keeps the student on their setup screen until they search, ignoring stale results', () => {
    expect(
      pairingStep({
        ...base,
        screen: 'ready',
        availability: DEVICE_AVAILABILITY.AVAILABLE,
        foundCount: 1,
      })
    ).toBe('ready');
  });

  it('follows a Bluetooth search to found or not found', () => {
    expect(
      pairingStep({ ...base, availability: DEVICE_AVAILABILITY.SEARCHING })
    ).toBe('searching');
    expect(
      pairingStep({
        ...base,
        availability: DEVICE_AVAILABILITY.AVAILABLE,
        foundCount: 1,
      })
    ).toBe('found');
    expect(pairingStep(base)).toBe('notFound');
  });

  it('shows a failed connect, but a fresh search replaces the old failure', () => {
    const failed = {
      ...base,
      availability: DEVICE_AVAILABILITY.AVAILABLE,
      foundCount: 1,
      connectionStatus: CONNECTION_STATUS.DISCONNECTED,
    };
    expect(pairingStep(failed)).toBe('failed');
    expect(
      pairingStep({ ...failed, availability: DEVICE_AVAILABILITY.SEARCHING })
    ).toBe('searching');
  });

  it('shows connecting while an attempt is in flight', () => {
    expect(
      pairingStep({
        ...base,
        availability: DEVICE_AVAILABILITY.AVAILABLE,
        foundCount: 1,
        connectionStatus: CONNECTION_STATUS.CONNECTING,
      })
    ).toBe('connecting');
  });

  it('follows LSL discovery from its own stream list, not Bluetooth availability', () => {
    const lsl = {
      ...base,
      isLSL: true,
      availability: DEVICE_AVAILABILITY.SEARCHING,
    };
    expect(pairingStep({ ...lsl, lslSearching: true })).toBe('searching');
    expect(pairingStep({ ...lsl, foundCount: 2 })).toBe('found');
    expect(pairingStep(lsl)).toBe('notFound');
  });
});
