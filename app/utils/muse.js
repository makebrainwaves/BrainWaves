const bluetooth = require("bleat").webbluetooth;
const { MUSE_SERVICE, MuseClient, zipSamples } = require("muse-js");
const { Observable } = require("rxjs");

// Just returns the client object from Muse JS
export const initMuseClient = () => {
  const client = new MuseClient();
  client.enableAux = true;
  return client;
};

// Awaits Muse connectivity before sending an observable rep. EEG stream
// If on Windows, will use bleat to bridge to noble and the noble-winrt bindings
// IF on Mac or Linux, will proceed to use web bluetooth
export const createRawMuseObservable = async client => {
  if (process.platform === "win32") {
    const device = await bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE] }]
    });
    const gatt = await device.gatt.connect();
    await client.connect(gatt);
  } else {
    await client.connect();
  }
  await client.start();
  const eegStream = await client.eegReadings;
  return Observable.from(zipSamples(eegStream));
};

// TODO: Implement marker injection in muse-js
export const injectMuseMarker = (client, value, time) => {
  console.log("inject Muse Marker: ", value, time);
};
