import { withLatestFrom, map } from "rxjs/operators";
import { MUSE_SAMPLING_RATE } from "../../constants/constants";

const bluetooth = require("bleat").webbluetooth;
const { MUSE_SERVICE, MuseClient, zipSamples } = require("muse-js");
const { Observable } = require("rxjs");

const INTER_SAMPLE_INTERVAL = 1 / 256;

// Just returns the client object from Muse JS
export const initMuseClient = () => {
  const client = new MuseClient();
  client.enableAux = true;
  return client;
};

// Gets an available Muse device
// TODO: test whether this will ever return multiple devices if available
export const getMuse = async () => {
  let device = {};
  if (process.platform === "win32") {
    device = await bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE] }]
    });
  } else {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE] }]
    });
  }
  return [device];
};

// Attempts to connect to a muse device. If successful, returns a device info object
export const connectToMuse = async (client, device) => {
  if (process.platform === "win32") {
    const gatt = await device.gatt.connect();
    console.log(gatt);
    await client.connect(gatt);
  } else {
    await client.connect();
  }
  return { name: client.deviceName, samplingRate: MUSE_SAMPLING_RATE };
};

// Awaits Muse connectivity before sending an observable rep. EEG stream
// If on Windows, will use bleat to bridge to noble and the noble-winrt bindings
// IF on Mac or Linux, will proceed to use web bluetooth
export const createRawMuseObservable = async client => {
  await client.start();
  const eegStream = await client.eegReadings;
  const markers = await client.eventMarkers;
  console.log(client);
  await client.injectMarker(0, 0);
  return Observable.from(zipSamples(eegStream)).pipe(
    withLatestFrom(markers),
    map(([eegSample, marker]) => {
      if (
        eegSample["timestamp"] - marker["timestamp"] > 0 &&
        eegSample["timestamp"] - marker["timestamp"] <= INTER_SAMPLE_INTERVAL
      ) {
        console.log(
          "injected marker with delay of ",
          Math.abs(eegSample["timestamp"] - marker["timestamp"])
        );
        return { ...eegSample, marker: marker["timestamp"] };
      }
      return eegSample;
    })
  );
};

// Injects an event marker that will be included in muse-js's data stream through
export const injectMuseMarker = (client, value, time) => {
  console.log(value);
  client.injectMarker(value, time);
};
