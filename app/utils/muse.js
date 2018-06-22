import { MUSE_SERVICE, MuseClient, zipSamples, channelNames } from "muse-js";

const initMuseClient = () => {
  return new MuseClient();
};

const createStream = async () => {
  const client = initMuseClient();
  console.log(client);
  await client.connect();
  client.controlResponses.subscribe(x => console.log("Response:", x));
  await client.start();
  console.log("Connected!");

  client.eegReadings.subscribe(reading => {
    console.log(reading);
  });
  client.telemetryData.subscribe(telemetry => {
    console.log(telemetry);
  });
  client.accelerometerData.subscribe(acceleration => {
    console.log(acceleration);
  });
};

module.exports = { createStream };
