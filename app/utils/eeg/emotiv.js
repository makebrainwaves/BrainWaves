/*
 * Adapted from the Cortex example, this file provides functions for creating a Cortex client and creating
 * an RxJS Observable of raw EEG data
 *
 */
import { Observable } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET } from "../../../keys";
import { EMOTIV_CHANNELS } from "../../constants/constants";
import Cortex from "./cortex";

// Just returns the Cortex object from SDK
export const initCortex = () => {
  const verbose = process.env.LOG_LEVEL || 1;
  const options = { verbose };

  return new Cortex(options);
};

// Gets a list of available Emotiv devices
export const getEmotiv = async client => {
  const devices = await client.queryHeadsets();
  return devices;
};

export const connectToEmotiv = (client, device) =>
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
      client.createSession({
        status: "active"
      })
    )
    .then(
      session => ({
        name: session.headset.id,
        samplingRate: session.settings.eegRate
      }),
      err => console.log(err)
    );

// Returns an observable that will handle both connecting to Client and providing a source of EEG data
export const createRawEmotivObservable = client =>
  Observable.from(client.subscribe({ streams: ["eeg"] })).pipe(
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
  console.log("inject emotiv marker: ", value, time);
  client.injectMarker({ label: "event", value, time });
};

// ---------------------------------------------------------------------
// Helpers

// Removes the redundant stuff included in the Cortex SDK eeg return
// 14 EEG channels followed by one value for the event marker
const pruneEEG = eegArray => {
  console.log(eegArray[eegArray.length - 1]);
  const prunedArray = new Array(EMOTIV_CHANNELS.length + 1);
  for (let i = 0; i < EMOTIV_CHANNELS.length; i++) {
    prunedArray[i] = eegArray[i + 3];
  }
  prunedArray[EMOTIV_CHANNELS.length] = eegArray[eegArray.length - 1];
  return prunedArray;
};
