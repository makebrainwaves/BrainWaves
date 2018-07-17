/*
 * Adapted from the Cortex example, this file provides functions for creating a Cortex client and creating
 * an RxJS Observable of raw EEG data
 *
 */
import { Observable } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET } from "../../keys";
import { EMOTIV_CHANNELS } from "../constants/constants";

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
          .createSession({
            status: "active"
          })
          .subscribe({ streams: ["eeg"] })
      )
  ).pipe(
    mergeMap(subs => {
      if (!subs[0].eeg) throw new Error("failed to subscribe");
      return Observable.fromEvent(client, "eeg").pipe(
        map(eegEvent => ({
          data: pruneEEG(eegEvent.eeg),
          timestamp: eegEvent.time
        }))
      );
    })
  );

export const injectEmotivMarker = (client, value, time) => {
  console.log("inject marker called");
  client.injectMarker({ label: "event", value, time });
};

// ---------------------------------------------------------------------
// Helpers

const pruneEEG = eegArray => {
  const prunedArray = new Array(EMOTIV_CHANNELS.length + 1);
  for (let i = 0; i < EMOTIV_CHANNELS.length; i++) {
    prunedArray[i] = eegArray[i + 3];
  }
  prunedArray[EMOTIV_CHANNELS.length] = eegArray[eegArray.length - 1];
  return prunedArray;
};
