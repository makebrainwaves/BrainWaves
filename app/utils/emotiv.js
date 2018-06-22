/*
 * Adapted from the Cortex example, this will return an RxJS observable of raw EEG data
 *
 */
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/observable/fromEvent";
import { mergeMap, map, tap } from "rxjs/operators";
import { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET } from "../../keys";

// TODO: Slim this down to just initing and returning Cortex client object for Redux
function initCortex() {
  const verbose = process.env.LOG_LEVEL || 1;
  const options = { verbose };

  return new Cortex(options);
}

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
    tap(() => console.log("authentication and created session")),
    mergeMap(subs => {
      if (!subs[0].eeg) throw new Error("failed to subscribe");
      return Observable.fromEvent(client, "eeg").pipe(map(onEEG));
    })
  );
}

const createStream = () => {
  const client = initCortex();
  console.log("created new client", client);

  // these values need to be filled to run example
  const auth = {
    username: USERNAME,
    password: PASSWORD,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  };

  const onEEG = data => ({
    data: data.eeg,
    timestamp: data.time
  });

  const rawObservable = createRawEmotivObservable(client, auth, onEEG);

  console.log("created Raw Observable");

  rawObservable.subscribe(console.log);
};

module.exports = { createRawEmotivObservable, initCortex, createStream };
