import { share, filter, map } from 'rxjs/operators';
import {
  addInfo,
  epoch,
  bandpassFilter,
  addSignalQuality,
} from '@neurosity/pipes';
import { MUSE_SERVICE, MuseClient, zipSamples } from 'muse-js';
import { from, Observable } from 'rxjs';
import { parseMuseSignalQuality } from './pipes';
import {
  MUSE_SAMPLING_RATE,
  MUSE_CHANNELS,
  PLOTTING_INTERVAL,
} from '../../constants/constants';
import { Device, DeviceInfo, EEGData } from '../../constants/interfaces';
import { createMarkerStamper, MarkerStamper } from './markerRegistry';
import { EEGDriver } from './types';

// Windows 7 check removed — process.platform and os.release are not available in renderer context

const client = new MuseClient();
client.enableAux = false;

// Stamps the shared marker timing rule onto the Muse sample stream
// (markerRegistry.createMarkerStamper).
let markerStamper: MarkerStamper | null = null;
const MUSE_SAMPLE_INTERVAL_MS = 1000 / MUSE_SAMPLING_RATE;

// Cached BluetoothDevice from the last getMuse() scan so that connectToMuse()
// can reuse it without triggering a second requestDevice() call (which would
// fire another select-bluetooth-device event in the main process).
let cachedDevice: BluetoothDevice | null = null;

// Gets an available Muse device. In Electron, requestDevice() triggers the
// select-bluetooth-device IPC event in the main process, which auto-selects
// the first Muse headset found via BLE.
// TODO: is being able to request only one Muse at a time a problem in a classroom scenario?
export const getMuse = async () => {
  const deviceInstance = await navigator.bluetooth.requestDevice({
    filters: [{ services: [MUSE_SERVICE] }],
  });
  cachedDevice = deviceInstance;
  return [{ id: deviceInstance.id, name: deviceInstance.name }];
};

// Attempts to connect to a muse device. If successful, returns a device info object.
// Reuses the BluetoothDevice cached by getMuse() to avoid a redundant requestDevice() call.
export const connectToMuse = async (device: Device) => {
  const deviceInstance =
    cachedDevice ??
    (await navigator.bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE], name: device.name }],
    }));
  cachedDevice = null;
  const gatt = await deviceInstance.gatt?.connect();
  await client.connect(gatt);
  return {
    name: client.deviceName,
    samplingRate: MUSE_SAMPLING_RATE,
    channels: MUSE_CHANNELS,
  };
};

export const disconnectFromMuse = () => {
  cachedDevice = null;
  markerStamper = null;
  client.disconnect();
};

// Emits when the BLE connection drops after having been up. Intentionally
// ignores the initial `false` from BehaviorSubject — we only care about
// transitions from connected → disconnected.
// muse-js bundles its own rxjs; bridge into this app's rxjs via a thin wrapper.
export const museDisconnect$: Observable<void> = new Observable<void>(
  (subscriber) => {
    const sub = (
      client.connectionStatus as unknown as {
        subscribe: (n: (v: boolean) => void) => { unsubscribe: () => void };
      }
    ).subscribe(
      (() => {
        let prev: boolean | undefined;
        return (curr: boolean) => {
          if (prev === true && curr === false) subscriber.next();
          prev = curr;
        };
      })()
    );
    return () => sub.unsubscribe();
  }
);

// Cancels any in-progress BLE scan by telling the main process to reject the
// pending requestDevice() call. Called when the student cancels the search.
export const cancelMuseScan = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electronAPI?.cancelBluetoothSearch();
};

// Awaits Muse connectivity before sending an observable rep. EEG stream
export const createRawMuseObservable = async () => {
  await client.start();
  const stamper = createMarkerStamper(MUSE_SAMPLE_INTERVAL_MS);
  markerStamper = stamper;
  const eegStream = await client.eegReadings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return from(zipSamples(eegStream) as any).pipe(
    // muse-js zipSamples return type lacks Observable generic
    // Remove nans if present (muse 2)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map((sample: any) => ({
      // muse-js EEGSample type doesn't expose data.filter
      ...sample,
      data: sample.data.filter((val) => !Number.isNaN(val)),
    })),
    filter((sample) => sample.data.length >= 4),
    map((sample: EEGData) => stamper.stamp(sample)),
    share()
  );
};

// Creates an observable that will epoch, filter, and add signal quality to EEG stream
export const createMuseSignalQualityObservable = (
  rawObservable: Observable<EEGData>,
  deviceInfo
) => {
  const { samplingRate, channels: channelNames } = deviceInfo;
  const intervalSamples = (PLOTTING_INTERVAL * samplingRate) / 1000;
  return rawObservable.pipe(
    addInfo({
      samplingRate,
      channelNames,
    }),
    epoch({
      duration: intervalSamples,
      interval: intervalSamples,
    }),
    bandpassFilter({
      nbChannels: channelNames.length,
      cutoffFrequencies: [1, 50],
    }),
    addSignalQuality(),
    parseMuseSignalQuality()
  );
};

// Injects an event marker by queueing it for the EEG sample whose interval
// contains the marker timestamp. The timestamp argument (from the runtime
// callback) is aligned against each sample's timestamp for bounded error.
export const injectMuseMarker = (code: number, timestamp: number) => {
  markerStamper?.inject(code, timestamp);
};

// The Muse implementation of the shared device-driver contract. deviceEpics
// resolves this via the registry in ./index rather than branching on deviceType.
export const museDriver: EEGDriver = {
  scan: getMuse,
  connect: (device: Device) =>
    connectToMuse(device) as Promise<DeviceInfo | null>,
  disconnect: disconnectFromMuse,
  cancelScan: cancelMuseScan,
  createRawObservable: createRawMuseObservable,
  injectMarker: injectMuseMarker,
  disconnect$: () => museDisconnect$,
};
