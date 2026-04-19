/**
 * LSL Inlet driver — exposes a remote LSL EEG stream as a renderer
 * Observable<EEGData> compatible with the rest of the app.
 *
 * Discovery and inlet I/O happen in the main process (see src/main/lsl/inlets.ts).
 * The renderer subscribes via IPC and converts the chunked LSLInletEpoch
 * messages back into per-sample EEGData events.
 */
import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import type {
  DiscoveredStream,
  LSLInletEpoch,
} from '../../../shared/lslTypes';
import { EEGData } from '../../constants/interfaces';

let activeUid: string | null = null;
let inletSubject: Subject<EEGData> | null = null;
let inletDataUnsubscribe: (() => void) | null = null;
let inletDisconnectedUnsubscribe: (() => void) | null = null;

export const discoverLSLStreams = (): Promise<DiscoveredStream[]> =>
  window.electronAPI.discoverLSLStreams();

export const connectToLSLInlet = (stream: DiscoveredStream) => {
  activeUid = stream.uid;
  return {
    name: stream.name,
    samplingRate: stream.sampleRate || 0,
    channels: makeChannelLabels(stream),
  };
};

const makeChannelLabels = (stream: DiscoveredStream): string[] =>
  Array.from({ length: stream.channelCount }, (_, i) => `Ch${i + 1}`);

export const createRawLSLInletObservable = async (
  stream: DiscoveredStream
): Promise<Observable<EEGData>> => {
  if (inletSubject) inletSubject.complete();
  inletDataUnsubscribe?.();
  inletDisconnectedUnsubscribe?.();

  const subject = new Subject<EEGData>();
  inletSubject = subject;
  activeUid = stream.uid;

  inletDataUnsubscribe = window.electronAPI.onLSLInletData((epoch: LSLInletEpoch) => {
    if (epoch.uid !== stream.uid) return;
    const { samples, timestamps } = epoch;
    for (let i = 0; i < samples.length; i++) {
      // LSL timestamps are in seconds; convert to ms to match EEGData convention.
      subject.next({
        data: samples[i],
        timestamp: timestamps[i] * 1000,
      });
    }
  });

  inletDisconnectedUnsubscribe = window.electronAPI.onLSLInletDisconnected(
    (payload) => {
      if (payload.uid === stream.uid) subject.complete();
    }
  );

  window.electronAPI.subscribeLSLStream(stream.uid);
  return subject.asObservable().pipe(share());
};

export const disconnectFromLSLInlet = (): void => {
  if (activeUid) {
    window.electronAPI.unsubscribeLSLStream(activeUid);
    activeUid = null;
  }
  inletSubject?.complete();
  inletSubject = null;
  inletDataUnsubscribe?.();
  inletDataUnsubscribe = null;
  inletDisconnectedUnsubscribe?.();
  inletDisconnectedUnsubscribe = null;
};
