import {
  withLatestFrom,
  share,
  startWith,
  filter,
  tap,
  map,
} from 'rxjs/operators';
import {
  addInfo,
  epoch,
  bandpassFilter,
  addSignalQuality,
} from '@neurosity/pipes';
import { MUSE_SERVICE, MuseClient, zipSamples, EEGSample } from 'muse-js';
import { from, Observable } from 'rxjs';
import { isNaN } from 'lodash';
import { parseMuseSignalQuality } from './pipes';
import {
  MUSE_SAMPLING_RATE,
  MUSE_CHANNELS,
  PLOTTING_INTERVAL,
} from '../../constants/constants';
import { Device, EEGData } from '../../constants/interfaces';

const INTER_SAMPLE_INTERVAL = -(1 / 256) * 1000;

// Windows 7 check removed — process.platform and os.release are not available in renderer context

const client = new MuseClient();
client.enableAux = false;

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
    cachedDevice ?? (await navigator.bluetooth.requestDevice({
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
  client.disconnect();
};

// Cancels any in-progress BLE scan by telling the main process to reject the
// pending requestDevice() call. Called when the search timer expires.
export const cancelMuseScan = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electronAPI?.cancelBluetoothSearch();
};

// Awaits Muse connectivity before sending an observable rep. EEG stream
export const createRawMuseObservable = async () => {
  await client.start();
  const eegStream = await client.eegReadings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = await (client.eventMarkers as any).pipe(
    startWith({ timestamp: 0 })
  ); // muse-js eventMarkers not typed as Observable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return from(zipSamples(eegStream) as any).pipe(
    // muse-js zipSamples return type lacks Observable generic
    // Remove nans if present (muse 2)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map((sample: any) => ({
      // muse-js EEGSample type doesn't expose data.filter
      ...sample,
      data: sample.data.filter((val) => !isNaN(val)),
    })),
    filter((sample) => sample.data.length >= 4),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withLatestFrom(markers as any, synchronizeTimestamp), // markers inferred as any from above
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

// Injects an event marker that will be included in muse-js's data stream through
export const injectMuseMarker = (value: string, time: number) => {
  client.injectMarker(value, time);
};

// ---------------------------------------------------------------------
// Helpers

const synchronizeTimestamp = (eegSample, marker) => {
  if (
    eegSample.timestamp - marker.timestamp < 0 &&
    eegSample.timestamp - marker.timestamp >= INTER_SAMPLE_INTERVAL
  ) {
    return { ...eegSample, marker: marker.value };
  }
  return eegSample;
};
