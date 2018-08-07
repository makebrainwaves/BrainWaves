import { withLatestFrom, tap, map } from "rxjs/operators";

const bluetooth = require("bleat").webbluetooth;
const { MUSE_SERVICE, MuseClient, zipSamples } = require("muse-js");
const { Observable } = require("rxjs");

// Just returns the client object from Muse JS
export const initMuseClient = () => {
  const client = new MuseClient();
  client.enableAux = true;
  return client;
};

// Attempts to connect to a muse device. If successful, returns a device info object
export const connectMuse = async client => {
  if (process.platform === "win32") {
    const device = await bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE] }]
    });
    const gatt = await device.gatt.connect();
    await client.connect(gatt);
  } else {
    await client.connect();
  }
  return client.deviceName;
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
      if (Math.abs(eegSample["timestamp"] - marker["timestamp"]) <= 2) {
        console.log(
          "injected marker with delay of ",
          eegSample["timestamp"] - marker["timestamp"]
        );
        return { ...eegSample, marker: marker.value };
      }
      return eegSample;
    })
  );
};

// Injects an event marker that will be included in muse-js's data stream through
export const injectMuseMarker = (client, value, time) => {
  client.injectMarker(value, time);
};
