/*
 * Adapted from the Cortex example, this file provides functions for creating a Cortex client and creating
 * an RxJS Observable of raw EEG data
 *
 */
import { fromEvent } from 'rxjs';
import { map, withLatestFrom, share } from 'rxjs/operators';
import { addInfo, epoch, bandpassFilter } from '@neurosity/pipes';
import { toast } from 'react-toastify';
import { parseEmotivSignalQuality } from './pipes';
import {
  USERNAME,
  PASSWORD,
  CLIENT_ID,
  CLIENT_SECRET,
  LICENSE_ID
} from '../../../keys';
import { EMOTIV_CHANNELS, PLOTTING_INTERVAL } from '../../constants/constants';
import Cortex from './cortex';

// Creates the Cortex object from SDK
const verbose = process.env.LOG_LEVEL || 1;
const options = { verbose };
const client = new Cortex(options);
// Used to explictly link event markers to session
let sessionID = null;

// Gets a list of available Emotiv devices
export const getEmotiv = async () => {
  const devices = await client.queryHeadsets();
  devices.push([{ id: 'Emotiv-debug' }]);
  return devices;
};

export const connectToEmotiv = device =>
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
    .catch(err => {
      toast.error(`Authentication failed. ${err}`);
      return err;
    })
    .then(() => client.getLicenseInfo())
    .then(() =>
      client.createSession({
        status: 'active',
        headset: device.id
      })
    )
    .catch(err => {
      toast.error(`Session creation failed. ${err} `);
      return err;
    })
    .then(session => {
      if (session.headset === undefined) {
        return new Error('Session does not exist');
      }
      sessionID = session.id;

      return {
        name: session.headset.id,
        samplingRate: session.headset.settings.eegRate,
        channels: EMOTIV_CHANNELS
      };
    })
    .catch(err => {
      toast.error(`Couldn't connect to device ${device.id}: ${err}`);
      return err;
    });

export const disconnectFromEmotiv = async () => {
  const sessionStatus = await client.updateSession({ status: 'close' });
  return sessionStatus;
};

// Returns an observable that will handle both connecting to Client and providing a source of EEG data
export const createRawEmotivObservable = async () => {
  const subs = await client.subscribe({ streams: ['eeg', 'dev'] });
  if (!subs[0].eeg) {
    toast.error(`Subscription to Session data failed`);
  }
  return fromEvent(client, 'eeg').pipe(map(createEEGSample));
};

// Creates an observable that will epoch, filter, and add signal quality to EEG stream
export const createEmotivSignalQualityObservable = rawObservable => {
  const signalQualityObservable = fromEvent(client, 'dev');
  const samplingRate = 128;
  const channels = EMOTIV_CHANNELS;
  const intervalSamples = (PLOTTING_INTERVAL * samplingRate) / 1000;
  return rawObservable.pipe(
    addInfo({
      samplingRate,
      channels
    }),
    epoch({
      duration: intervalSamples,
      interval: intervalSamples
    }),
    bandpassFilter({
      nbChannels: channels.length,
      lowCutoff: 1,
      highCutoff: 50
    }),
    withLatestFrom(signalQualityObservable, integrateSignalQuality),
    parseEmotivSignalQuality(),
    share()
  );
};

export const injectEmotivMarker = (value, time) => {
  if (sessionID !== null) {
    client.injectMarker({ label: 'event', id: sessionID, value, time });
  }
  client.injectMarker({ label: 'event', value, time });
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
  return { data: prunedArray, timestamp: eegEvent.time * 1000 };
};

const integrateSignalQuality = (newEpoch, devSample) => ({
  ...newEpoch,
  signalQuality: Object.assign(
    ...devSample.dev[2].map((signalQuality, index) => ({
      [EMOTIV_CHANNELS[index]]: signalQuality
    }))
  )
});
