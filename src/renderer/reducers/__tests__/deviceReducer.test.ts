import { describe, expect, it } from 'vitest';
import { DeviceActions } from '../../actions';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import deviceReducer from '../deviceReducer';

const initial = deviceReducer(undefined, { type: '@@INIT' });
const MUSE_A = { id: 'a', name: 'Muse-AAAA' };
const MUSE_B = { id: 'b', name: 'Muse-BBBB' };
const STREAM = {
  uid: 'u1',
  name: 'EEG',
  type: 'EEG',
  channelCount: 8,
  sampleRate: 250,
  sourceId: 's',
};

describe('deviceReducer', () => {
  it('lists only the latest search result, so a stale headset cannot be picked', () => {
    const first = deviceReducer(initial, DeviceActions.DeviceFound([MUSE_A]));
    const second = deviceReducer(first, DeviceActions.DeviceFound([MUSE_B]));

    expect(second.availableDevices).toEqual([MUSE_B]);
    expect(second.deviceAvailability).toBe(DEVICE_AVAILABILITY.AVAILABLE);
  });

  it('a new Bluetooth or LSL search clears a previous failed connect', () => {
    const failed = deviceReducer(
      initial,
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.DISCONNECTED)
    );

    for (const search of [
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING),
      DeviceActions.DiscoverLSLStreams(),
    ]) {
      const next = deviceReducer(failed, search);
      expect(next.deviceAvailability).toBe(DEVICE_AVAILABILITY.SEARCHING);
      expect(next.connectionStatus).toBe(CONNECTION_STATUS.NOT_YET_CONNECTED);
    }
  });

  it('ends LSL discovery as found or not found from the stream list', () => {
    const searching = deviceReducer(
      initial,
      DeviceActions.DiscoverLSLStreams()
    );

    expect(
      deviceReducer(searching, DeviceActions.SetAvailableLSLStreams([STREAM]))
        .deviceAvailability
    ).toBe(DEVICE_AVAILABILITY.AVAILABLE);
    expect(
      deviceReducer(searching, DeviceActions.SetAvailableLSLStreams([]))
        .deviceAvailability
    ).toBe(DEVICE_AVAILABILITY.NONE);
  });

  it('an LSL connect is LSL-typed and connecting before the inlet reports', () => {
    const next = deviceReducer(
      initial,
      DeviceActions.ConnectToLSLStream(STREAM)
    );

    expect(next.deviceType).toBe(DEVICES.LSL);
    expect(next.connectionStatus).toBe(CONNECTION_STATUS.CONNECTING);
  });

  it('keeps the chosen device type across a disconnect', () => {
    const crown = deviceReducer(
      deviceReducer(initial, DeviceActions.SetDeviceType(DEVICES.NEUROSITY)),
      DeviceActions.ConnectToDevice(MUSE_A)
    );

    const cleaned = deviceReducer(crown, DeviceActions.Cleanup());

    expect(cleaned.deviceType).toBe(DEVICES.NEUROSITY);
    expect(cleaned.connectionStatus).toBe(CONNECTION_STATUS.NOT_YET_CONNECTED);
  });
});
