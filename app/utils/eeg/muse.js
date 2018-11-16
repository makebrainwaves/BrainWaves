import "hazardous";
import { withLatestFrom, share, startWith, filter } from "rxjs/operators";
import {
  addInfo,
  epoch,
  bandpassFilter,
  addSignalQuality
} from "@neurosity/pipes";
import { release } from "os";
import { parseMuseSignalQuality } from "./pipes";
import {
  MUSE_SAMPLING_RATE,
  MUSE_CHANNELS,
  PLOTTING_INTERVAL
} from "../../constants/constants";

if (process.platform != "win32" || release().split(".")[0] >= 10) {
  const bluetooth = require("bleat").webbluetooth;
  const { MUSE_SERVICE, MuseClient, zipSamples } = require("muse-js");
  const { from } = require("rxjs");

  const INTER_SAMPLE_INTERVAL = -(1 / 256) * 1000;

  // Just returns the client object from Muse JS
  const client = new MuseClient();
  client.enableAux = true;
}
// Gets an available Muse device
// TODO: test whether this will ever return multiple devices if available
export const getMuse = async () => {
  let device = {};
  if (process.platform === "win32") {
    if (release().split(".")[0] >= 10) {
      device = await bluetooth.requestDevice({
        filters: [{ services: [MUSE_SERVICE] }]
      });
    }
  } else {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE] }]
    });
  }
  return [device];
};

// Attempts to connect to a muse device. If successful, returns a device info object
export const connectToMuse = async device => {
  if (process.platform === "win32") {
    const gatt = await device.gatt.connect();
    await client.connect(gatt);
  } else {
    await client.connect();
  }
  return {
    name: client.deviceName,
    samplingRate: MUSE_SAMPLING_RATE,
    channels: MUSE_CHANNELS
  };
};

export const disconnectFromMuse = () => client.disconnect();

// Awaits Muse connectivity before sending an observable rep. EEG stream
export const createRawMuseObservable = async () => {
  await client.start();
  const eegStream = await client.eegReadings;
  const markers = await client.eventMarkers.pipe(startWith({ timestamp: 0 }));
  return from(zipSamples(eegStream)).pipe(
    filter(sample => !sample.data.includes(NaN)),
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
      channelNames
    }),
    epoch({
      duration: intervalSamples,
      interval: intervalSamples
    }),
    bandpassFilter({
      nbChannels: channelNames.length,
      lowCutoff: 1,
      highCutoff: 50
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
    eegSample["timestamp"] - marker["timestamp"] < 0 &&
    eegSample["timestamp"] - marker["timestamp"] >= INTER_SAMPLE_INTERVAL
  ) {
    return { ...eegSample, marker: marker["value"] };
  }
  return eegSample;
};
