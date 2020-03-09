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
import { CLIENT_ID, CLIENT_SECRET, LICENSE_ID } from '../../../keys';
import { EMOTIV_CHANNELS, PLOTTING_INTERVAL } from '../../constants/constants';
import Cortex from './cortex';

// Creates the Cortex object from SDK
const verbose = process.env.LOG_LEVEL || 1;
const options = { verbose };

// This global client is used in every Cortex API call
const client = new Cortex(options);

// This global session is how I'm passing data between connectToEmotiv and createRawEmotivObservable
// I'm not a fan of doing this but I don't want to refactor the Redux store based on this API change that
// Emotiv is introducing
let session;

// Gets a list of available Emotiv devices
export const getEmotiv = async () => {
  const devices = await client.queryHeadsets();
  return devices;
};

export const connectToEmotiv = async (device) => {
  await client.ready;

  // Authenticate
  try {
    await client.init({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      license: LICENSE_ID,
      debit: 1,
    });
  } catch (err) {
    toast.error(`Authentication failed. ${err.message}`);
    return;
  }
  // Connect
  try {
    await client.controlDevice({ command: 'connect', headset: device.id });
  } catch (err) {
    toast.error(`Emotiv connection failed. ${err.message}`);
    return;
  }
  // Create Session
  try {
    const newSession = await client.createSession({
      status: 'active',
      headset: device.id,
    });
    session = newSession;

    return {
      name: session.headset.id,
      samplingRate: session.headset.settings.eegRate,
      channels: EMOTIV_CHANNELS,
    };
  } catch (err) {
    toast.error(`Session creation failed. ${err.message} `);
  }
};

export const disconnectFromEmotiv = async () => {
  console.log('disconnecting form emotiv');
  const sessionStatus = await client.updateSession({
    session: session.id,
    status: 'close',
  });
  return sessionStatus;
};

// Returns an observable that will handle both connecting to Client and providing a source of EEG data
export const createRawEmotivObservable = async () => {
  if (!session) {
    throw new Error('Emotiv must be connected to before subscribing to EEG');
  }
  try {
    await client.subscribe({
      session: session.id,
      streams: ['eeg', 'dev'],
    });
  } catch (err) {
    toast.error(`EEG connection failed. ${err.message}`);
  }

  return fromEvent(client, 'eeg').pipe(map(createEEGSample));
};

// Creates an observable that will epoch, filter, and add signal quality to EEG stream
export const createEmotivSignalQualityObservable = (rawObservable) => {
  const signalQualityObservable = fromEvent(client, 'dev');
  const samplingRate = 128;
  const channels = EMOTIV_CHANNELS;
  const intervalSamples = (PLOTTING_INTERVAL * samplingRate) / 1000;
  return rawObservable.pipe(
    addInfo({
      samplingRate,
      channels,
    }),
    epoch({
      duration: intervalSamples,
      interval: intervalSamples,
    }),
    bandpassFilter({
      nbChannels: channels.length,
      lowCutoff: 1,
      highCutoff: 50,
    }),
    withLatestFrom(signalQualityObservable, integrateSignalQuality),
    parseEmotivSignalQuality(),
    share()
  );
};

export const injectEmotivMarker = (value, time) => {
  client.injectMarker({ label: 'event', value, time, session: session.id });
};

export const createEmotivRecord = (subjectName, sessionNumber) => {
  client.createRecord({
    session: session.id,
    title: `${subjectName}_${sessionNumber}`,
  });
};

export const stopEmotivRecord = () => {
  client.stopRecord({ session: session.id });
};

// ---------------------------------------------------------------------
// Helpers

// Converts Cortex SDK eeg event format to EEGData format to make it consistent with Muse
// 14 EEG channels in data
// timestamp in ms
// Event marker in marker if present
const createEEGSample = (eegEvent) => {
  const prunedArray = new Array(EMOTIV_CHANNELS.length);
  for (let i = 0; i < EMOTIV_CHANNELS.length; i++) {
    prunedArray[i] = eegEvent.eeg[i + 2];
  }
  if (eegEvent.eeg[eegEvent.eeg.length - 1].length >= 1) {
    const marker =
      (eegEvent.eeg[eegEvent.eeg.length - 1][0] &&
        eegEvent.eeg[eegEvent.eeg.length - 1][0].value) ||
      0;
    return { data: prunedArray, timestamp: eegEvent.time * 1000, marker };
  }
  return { data: prunedArray, timestamp: eegEvent.time * 1000 };
};

const integrateSignalQuality = (newEpoch, devSample) => ({
  ...newEpoch,
  signalQuality: Object.assign(
    ...devSample.dev[2].map((signalQuality, index) => ({
      [EMOTIV_CHANNELS[index]]: signalQuality,
    }))
  ),
});
