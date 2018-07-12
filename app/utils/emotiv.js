/*
 * Adapted from the Cortex example, this file provides functions for creating a Cortex client and creating
 * an RxJS Observable of raw EEG data
 *
 */

const { Observable } = require("rxjs");
const { mergeMap, map } = require("rxjs/operators");
const { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET } = require("../../keys");

export const initCortex = () => {
  const verbose = process.env.LOG_LEVEL || 1;
  const options = { verbose };

  return new Cortex(options);
};

export const createRawEmotivObservable = client =>
  Observable.from(
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
      return Observable.fromEvent(client, "eeg").pipe(map(pruneEEG));
    })
  );

export const injectEmotivMarker = (client, value, time) => {
  console.log("inject marker called");
  client.injectMarker({ label: "event", value, time });
};

// ---------------------------------------------------------------------
// Helpers

const pruneEEG = eegEvent => ({
  data: eegEvent.eeg.slice(3, 16).push(eegEvent.eeg[18]),
  timestamp: eegEvent.time
});
