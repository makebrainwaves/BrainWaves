import 'hazardous';
import { withLatestFrom, share, startWith, filter } from 'rxjs/operators';
import {
  addInfo,
  epoch,
  bandpassFilter,
  addSignalQuality,
} from '@neurosity/pipes';
import { release } from 'os';
import { MUSE_SERVICE, MuseClient, zipSamples } from 'muse-js';
import { from } from 'rxjs';
import { parseMuseSignalQuality } from './pipes';
import {
  MUSE_SAMPLING_RATE,
  MUSE_CHANNELS,
  PLOTTING_INTERVAL,
} from '../../constants/constants';

const INTER_SAMPLE_INTERVAL = -(1 / 256) * 1000;

if (
  process.platform === 'win32' &&
  parseInt(release().split('.')[0], 10) < 10
) {
  console.error('Muse EEG not available in Windows 7');
}

const client = new MuseClient();
client.enableAux = false;
console.log('this', this, 'ble', navigator.bluetooth);

// Gets an available Muse device
// TODO: test whether this will ever return multiple devices if available
export const getMuse = async () => {
  console.log('getting muse');
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [MUSE_SERVICE] }],
  });
  console.log('received ', device);
  return [device];
};

// Attempts to connect to a muse device. If successful, returns a device info object
export const connectToMuse = async (device: BluetoothDevice) => {
  await client.connect(device.gatt);
  return {
    name: client.deviceName,
    samplingRate: MUSE_SAMPLING_RATE,
    channels: MUSE_CHANNELS,
  };
};

export const disconnectFromMuse = () => client.disconnect();

// Awaits Muse connectivity before sending an observable rep. EEG stream
export const createRawMuseObservable = async () => {
  await client.start();
  const eegStream = await client.eegReadings;
  const markers = await client.eventMarkers.pipe(startWith({ timestamp: 0 }));
  return from(zipSamples(eegStream)).pipe(
    filter((sample) => !sample.data.includes(NaN)),
    withLatestFrom(markers, synchronizeTimestamp),
    share()
  );
};

// Creates an observable that will epoch, filter, and add signal quality to EEG stream
export const createMuseSignalQualityObservable = (
  rawObservable,
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
      lowCutoff: 1,
      highCutoff: 50,
    }),
    addSignalQuality(),
    parseMuseSignalQuality()
  );
};

// Injects an event marker that will be included in muse-js's data stream through
export const injectMuseMarker = (value, time) => {
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
