const bluetooth = require("bleat").webbluetooth;
const { MUSE_SERVICE, MuseClient, zipSamples } = require("muse-js");
const { Observable } = require("rxjs");

// Just returns the client object from Muse JS
export const initMuseClient = () => new MuseClient();

// Awaits Muse connectivity before sending an observable rep. EEG stream
export const createRawMuseObservable = async client => {
  const device = await bluetooth.requestDevice({
    filters: [{ services: [MUSE_SERVICE] }]
  });
  console.log("Found Device: ", device);
  const gatt = await device.gatt.connect();
  await client.connect(gatt);
  await client.start();
  console.log("Connected!");
  const eegStream = await client.eegReadings;
  return Observable.from(zipSamples(eegStream));
};

// TODO: Implement marker injection in muse-js
export const injectMuseMarker = (client, value, time) => {
  console.log("inject Muse Marker: ", value, time);
};
