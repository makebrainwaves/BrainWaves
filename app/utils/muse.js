const noble = require("noble-winrt");
const bluetooth = require("bleat").webbluetooth;
const { MuseClient, MUSE_SERVICE } = require("muse-js");

const createStream = () => {
  async function connect() {
    let device = await bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE] }]
    });
    console.log('Found Device: ', device);
    const gatt = await device.gatt.connect();
    const client = new MuseClient();
    await client.connect(gatt);
    await client.start();
    console.log('Connected!')
    // Now do whatever with muse client...
    client.eegReadings.subscribe(reading => {
      console.log(reading);
    });
  }

  noble.on("stateChange", state => {
    if (state === "poweredOn") {
      connect();
    }
  });
};

module.exports = { createStream };
