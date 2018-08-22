/*
 * Adapted from the Cortex example, this file provides functions for creating a Cortex client and creating
 * an RxJS Observable of raw EEG data
 *
 */
import { Observable } from "rxjs";
import { mergeMap, map, tap } from "rxjs/operators";
import {
  USERNAME,
  PASSWORD,
  CLIENT_ID,
  CLIENT_SECRET,
  LICENSE_ID
} from "../../../keys";
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
        license: LICENSE_ID,
        debit: 1
      })
    )
    .then(() =>
      client.createSession({
        status: "active",
        headset: device.id
      })
    )
    .then(
      session => {
        return {
          name: session.headset.id,
          samplingRate: session.headset.settings.eegRate
        };
      },
      err => console.log(err)
    );

// Returns an observable that will handle both connecting to Client and providing a source of EEG data
export const createRawEmotivObservable = async client => {
  const subs = await client.subscribe({ streams: ["eeg"] });
  if (!subs[0].eeg) throw new Error("failed to subscribe");
  return Observable.fromEvent(client, "eeg").pipe(map(createEEGSample));
};

export const injectEmotivMarker = (client, value, time) => {
  client.injectMarker({ label: "event", value, time });
};

// ---------------------------------------------------------------------
// Helpers

// Converts Cortex SDK eeg event format to EEGData format to make it consistent with Muse
// 14 EEG channels in data
// timestamp in ms
// Event marker in marker if present
const createEEGSample = eegEvent => {
  const prunedArray = new Array(EMOTIV_CHANNELS.length);
  for (let i = 0; i < EMOTIV_CHANNELS.length; i++) {
    prunedArray[i] = eegEvent.eeg[i + 3];
  }
  if (eegEvent.eeg[eegEvent.eeg.length - 1] >= 1) {
    const marker = eegEvent.eeg[eegEvent.eeg.length - 1];
    return { data: prunedArray, timestamp: eegEvent.time * 1000, marker };
  }
  return { data: prunedArray, timestamp: eegEvent.time  * 1000 };
};
