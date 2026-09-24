import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StateObservable } from 'redux-observable';
import { DeviceActions } from '../../actions';
import type { DeviceActionType } from '../../actions';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
  SEARCH_TIMEOUT_MS,
} from '../../constants/constants';
import type { RootState } from '../../reducers';
import deviceEpics from '../deviceEpics';

const driver = vi.hoisted(() => ({
  scan: vi.fn(),
  cancelScan: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  disconnect$: vi.fn(),
}));
const lsl = vi.hoisted(() => ({
  discoverLSLStreams: vi.fn(),
  connectToLSLInlet: vi.fn(),
  createRawLSLInletObservable: vi.fn(),
  disconnectFromLSLInlet: vi.fn(),
}));

vi.mock('../../utils/eeg', () => ({
  getDriver: () => driver,
  setActiveDriver: vi.fn(),
}));
vi.mock('../../utils/eeg/muse', () => ({
  createMuseSignalQualityObservable: vi.fn(),
}));
vi.mock('../../utils/eeg/lslInlet', () => lsl);
vi.mock('../../utils/eeg/lslBridge', () => ({}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));

const MUSE = { id: 'muse-1', name: 'Muse-4A2F' };
const INFO = { name: 'Muse-4A2F', samplingRate: 256, channels: ['AF7'] };

function harness(device: Partial<RootState['device']> = {}) {
  const actions = new Subject<DeviceActionType>();
  const deviceState = {
    deviceType: DEVICES.MUSE,
    deviceAvailability: DEVICE_AVAILABILITY.NONE,
    connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
    availableDevices: [],
    ...device,
  };
  const state = {
    value: { device: deviceState },
  } as unknown as StateObservable<RootState>;
  const out: DeviceActionType[] = [];
  const sub = deviceEpics(actions, state, undefined).subscribe((a) =>
    out.push(a)
  );
  return { actions, device: deviceState, out, sub };
}

/** Lets settled driver promises reach the epics (one macrotask turn, no fixed delay). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('device discovery', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('searches for a full minute, then stops the platform search and ends as not found', async () => {
    vi.useFakeTimers();
    driver.scan.mockReturnValue(new Promise(() => undefined));
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });

    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    await vi.advanceTimersByTimeAsync(SEARCH_TIMEOUT_MS - 1);
    expect(h.out).toEqual([]);
    expect(driver.cancelScan).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(driver.cancelScan).toHaveBeenCalledTimes(1);
    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
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
    h.device.deviceAvailability = DEVICE_AVAILABILITY.NONE;
    scan.reject(new Error('cancelled'));
    await flush();

    expect(driver.cancelScan).toHaveBeenCalledTimes(1);
    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
    h.sub.unsubscribe();
  });

  it('a cancelled search never hits the time limit later, even if the platform never answers', async () => {
    vi.useFakeTimers();
    driver.scan.mockReturnValue(new Promise(() => undefined));
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });
    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );

    h.actions.next(DeviceActions.CancelSearch());
    await vi.advanceTimersByTimeAsync(SEARCH_TIMEOUT_MS);

    expect(driver.cancelScan).toHaveBeenCalledTimes(1);
    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
    h.sub.unsubscribe();
  });

  it('never asks the Bluetooth driver to scan or cancel for an LSL search', () => {
    const h = harness({ deviceType: DEVICES.LSL });

    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    h.actions.next(DeviceActions.CancelSearch());

    expect(driver.scan).not.toHaveBeenCalled();
    expect(driver.cancelScan).not.toHaveBeenCalled();
    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
    h.sub.unsubscribe();
  });

  it('a cancelled search answering late cannot end the search that replaced it', async () => {
    const cancelled = Promise.withResolvers<never>();
    driver.scan
      .mockReturnValueOnce(cancelled.promise)
      .mockReturnValueOnce(new Promise(() => undefined));
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });
    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    h.actions.next(DeviceActions.CancelSearch());
    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    h.out.length = 0;

    cancelled.reject(new Error('cancelled'));
    await flush();

    expect(h.out).toEqual([]);
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

  it('never reports connected after the attempt was cancelled, and unlinks the late connection', async () => {
    const connect = Promise.withResolvers<typeof INFO>();
    driver.connect.mockReturnValue(connect.promise);
    const h = harness({ connectionStatus: CONNECTION_STATUS.CONNECTING });

    h.actions.next(DeviceActions.ConnectToDevice(MUSE));
    h.actions.next(DeviceActions.DisconnectFromDevice());
    const disconnectsBeforeLateSuccess = driver.disconnect.mock.calls.length;
    connect.resolve(INFO);
    await flush();

    expect(h.out).not.toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
    );
    expect(driver.disconnect).toHaveBeenCalledTimes(
      disconnectsBeforeLateSuccess + 1
    );
    h.sub.unsubscribe();
  });

  it('reports a failed LSL connect, closes the inlet, and keeps the epics alive', async () => {
    const STREAM = {
      uid: 'u1',
      name: 'EEG',
      type: 'EEG',
      channelCount: 8,
      sampleRate: 250,
      sourceId: 's',
    };
    lsl.connectToLSLInlet.mockReturnValue(INFO);
    lsl.createRawLSLInletObservable.mockRejectedValue(new Error('inlet'));
    lsl.discoverLSLStreams.mockResolvedValue([STREAM]);
    const h = harness({ deviceType: DEVICES.LSL });

    h.actions.next(DeviceActions.ConnectToLSLStream(STREAM));
    await flush();
    expect(h.out).toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.DISCONNECTED)
    );
    expect(lsl.disconnectFromLSLInlet).toHaveBeenCalled();

    h.actions.next(DeviceActions.DiscoverLSLStreams());
    await flush();
    expect(h.out).toContainEqual(
      DeviceActions.SetAvailableLSLStreams([STREAM])
    );
    h.sub.unsubscribe();
  });

  it('still notices a headset drop on a later connection in the same session', () => {
    const drop = new Subject<void>();
    driver.disconnect$.mockReturnValue(drop);
    const h = harness();

    h.actions.next(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
    );
    h.actions.next(DeviceActions.Cleanup());
    h.actions.next(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
    );
    drop.next();

    expect(h.out).toContainEqual(DeviceActions.DeviceLost());
    h.sub.unsubscribe();
  });
});
