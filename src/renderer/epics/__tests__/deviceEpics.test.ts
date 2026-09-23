import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StateObservable } from 'redux-observable';
import { DeviceActions } from '../../actions';
import type { DeviceActionType } from '../../actions';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import type { RootState } from '../../reducers';
import deviceEpics from '../deviceEpics';

const driver = vi.hoisted(() => ({
  scan: vi.fn(),
  cancelScan: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));
const lsl = vi.hoisted(() => ({ discoverLSLStreams: vi.fn() }));

vi.mock('../../utils/eeg', () => ({
  getDriver: () => driver,
  setActiveDriver: vi.fn(),
}));
vi.mock('../../utils/eeg/muse', () => ({
  createMuseSignalQualityObservable: vi.fn(),
}));
vi.mock('../../utils/eeg/lslInlet', () => lsl);
vi.mock('../../utils/eeg/lslBridge', () => ({}));

const MUSE = { id: 'muse-1', name: 'Muse-4A2F' };
const INFO = { name: 'Muse-4A2F', samplingRate: 256, channels: ['AF7'] };

function harness(device: Partial<RootState['device']> = {}) {
  const actions = new Subject<DeviceActionType>();
  const state = {
    value: {
      device: {
        deviceType: DEVICES.MUSE,
        deviceAvailability: DEVICE_AVAILABILITY.NONE,
        connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
        availableDevices: [],
        ...device,
      },
    },
  } as unknown as StateObservable<RootState>;
  const out: DeviceActionType[] = [];
  const sub = deviceEpics(actions, state, undefined).subscribe((a) =>
    out.push(a)
  );
  return { actions, state, out, sub };
}

/** Lets settled driver promises reach the epics (one macrotask turn, no fixed delay). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('device discovery', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('keeps searching until the driver answers — no timeout gives up', async () => {
    vi.useFakeTimers();
    driver.scan.mockReturnValue(new Promise(() => undefined));
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });

    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    await vi.advanceTimersByTimeAsync(60_000);

    expect(h.out).toEqual([]);
    expect(driver.cancelScan).not.toHaveBeenCalled();
    h.sub.unsubscribe();
  });

  it('ends the search as not found when the platform rejects the scan', async () => {
    driver.scan.mockRejectedValue(new Error('NotFoundError'));
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });

    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    await flush();

    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
    h.sub.unsubscribe();
  });

  it('cancelling stops the platform search and ends it without a not-found echo', async () => {
    const scan = Promise.withResolvers<never>();
    driver.scan.mockReturnValue(scan.promise);
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });
    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );

    h.actions.next(DeviceActions.CancelSearch());
    h.state.value.device.deviceAvailability = DEVICE_AVAILABILITY.NONE;
    scan.reject(new Error('cancelled'));
    await flush();

    expect(driver.cancelScan).toHaveBeenCalledTimes(1);
    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
    h.sub.unsubscribe();
  });

  it('reports not found when LSL discovery fails', async () => {
    lsl.discoverLSLStreams.mockRejectedValue(new Error('liblsl'));
    const h = harness({ deviceType: DEVICES.LSL });

    h.actions.next(DeviceActions.DiscoverLSLStreams());
    await flush();

    expect(h.out).toEqual([DeviceActions.SetAvailableLSLStreams([])]);
    h.sub.unsubscribe();
  });
});

describe('device connection', () => {
  afterEach(() => vi.clearAllMocks());

  it('reports a failed connect and still connects on the next try', async () => {
    driver.connect
      .mockRejectedValueOnce(new Error('GATT'))
      .mockResolvedValueOnce(INFO);
    const h = harness();

    h.actions.next(DeviceActions.ConnectToDevice(MUSE));
    await flush();
    expect(h.out).toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.DISCONNECTED)
    );

    h.actions.next(DeviceActions.ConnectToDevice(MUSE));
    await flush();
    expect(h.out).toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
    );
    h.sub.unsubscribe();
  });

  it('never reports connected after the attempt was cancelled', async () => {
    const connect = Promise.withResolvers<typeof INFO>();
    driver.connect.mockReturnValue(connect.promise);
    const h = harness({ connectionStatus: CONNECTION_STATUS.CONNECTING });

    h.actions.next(DeviceActions.ConnectToDevice(MUSE));
    h.actions.next(DeviceActions.DisconnectFromDevice());
    connect.resolve(INFO);
    await flush();

    expect(h.out).not.toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
    );
    h.sub.unsubscribe();
  });
});
