/*
 * Adapted from the Cortex example, this will return an RxJS observable of raw EEG data
 *
 */

const { Observable, from } = require("rxjs");
const { mergeMap, map } = require("rxjs/operators");
const { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET } = require("../../keys");

function createRawEmotivObservable(client, auth, onEEG) {
  return Observable.from(
    client.ready
      .then(() => client.init(auth))
      .then(() =>
        client
          .createSession({ status: "active" })
          .subscribe({ streams: ["eeg"] })
      )
  ).pipe(
    mergeMap(subs => {
      if (!subs[0].eeg) throw new Error("failed to subscribe");
      return Observable.fromEvent(client, "eeg").pipe(map(onEEG));
    })
  );
}

function createStream() {
  const verbose = process.env.LOG_LEVEL || 1;
  const options = { verbose };

  const client = new Cortex(options);
  // these values need to be filled to run example
  const auth = {
    username: "DEL2001",
    password: "SACKLER",
    client_id: "dBZd9QAuRs9beMlit6OsifkmhnbWBO78w2aPd65S",
    client_secret:
      "OZ1rhyCYOsh7edKXNGCjrBm08hywzIA72oH0Gge6TXa7BV9A02Pbk2z3cmbwpxy1hHtfnMJ9kdU98EPtP6bOG3hUr7wyBKoZTJQAF05AdxfTYs2GtFvSiSccN1b2erR5",
    debit: 1
  };

  const onEEG = data => ({
    data: data.eeg,
    timestamp: data.time
  });

  const rawObservable = createRawEmotivObservable(client, auth, onEEG);

  rawObservable.subscribe(console.log);
}

if (require.main === module) {
  process.on("unhandledRejection", err => {
    throw err;
  });

  const verbose = process.env.LOG_LEVEL || 1;
  const options = { verbose };

  const client = new Cortex(options);
  // these values need to be filled to run example
  const auth = {
    username: USERNAME,
    password: PASSWORD,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    debit: 1
  };

  const onEEG = data => ({
    data: data.eeg,
    timestamp: data.time
  });

  const rawObservable = createRawEmotivObservable(client, auth, onEEG);

  rawObservable.subscribe(console.log);
}

module.exports = { createRawEmotivObservable, createStream };
