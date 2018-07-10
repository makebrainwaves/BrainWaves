/*
 * Adapted from the Cortex example, this file provides functions for creating a Cortex client and creating
 * an RxJS Observable of raw EEG data
 *
 */

const { Observable } = require("rxjs");
const { mergeMap, map } = require("rxjs/operators");
const { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET } = require("../../keys");

function initCortex() {
  const verbose = process.env.LOG_LEVEL || 1;
  const options = { verbose };

  return new Cortex(options);
}

function createRawEmotivObservable(client) {
  return Observable.from(
    client.ready
      .then(() =>
        client.init({
          // These values need to be filled with personal Emotiv credentials
          username: USERNAME,
          password: PASSWORD,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          debit: 1
        })
      )
      .then(() =>
        client
          .createSession({ status: "active" })
          .subscribe({ streams: ["eeg"] })
      )
  ).pipe(
    mergeMap(subs => {
      if (!subs[0].eeg) throw new Error("failed to subscribe");
      return Observable.fromEvent(client, "eeg").pipe(
        map(data => ({
          ...data,
          data: data.eeg,
          timestamp: data.time
        }))
      );
    })
  );
}

function injectMarker(client, label, time) {
  client.injectMarker({ label, time });
}

if (require.main === module) {
  const rawObservable = createRawEmotivObservable(initCortex());
  rawObservable.subscribe(console.log);
}

module.exports = { createRawEmotivObservable, initCortex, injectMarker };
