const noble = require("noble-winrt");
const bluetooth = require("bleat").webbluetooth;
const {
  MUSE_SERVICE,
  MuseClient,
  zipSamples,
  channelNames
} = require("muse-js");
const { Observable } = require("rxjs");
const { mergeMap, map } = require("rxjs/operators");

function initMuseClient() {
  return new MuseClient();
}

async function createRawMuseObservable(client) {
  let device = await bluetooth.requestDevice({
    filters: [{ services: [MUSE_SERVICE] }]
  });
  console.log("Found Device: ", device);
  const gatt = await device.gatt.connect();
  await client.connect(gatt);
  await client.start();
  console.log("Connected!");
  const eegStream = await client.eegReadings;
  return eegStream
}

module.exports = { createRawMuseObservable, initMuseClient };
