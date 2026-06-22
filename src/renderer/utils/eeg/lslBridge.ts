/**
 * Renderer-side bridge to the main-process LSL outlet manager.
 *
 * Buffers raw EEG samples into small batches (~125ms @ 256Hz) to keep IPC
 * traffic low while preserving per-sample timestamps for the LSL outlet.
 */
import { Observable } from 'rxjs';
import { bufferCount, filter, map } from 'rxjs/operators';
import type { LSLEpoch, LSLMarker } from '../../../shared/lslTypes';
import { EEGData } from '../../constants/interfaces';

const DEFAULT_BATCH_SIZE = 32;

// Cache the main-process LSL availability so the hot epoch/marker paths don't
// flood IPC when liblsl isn't loaded. Probed once; defaults to false until the
// async check resolves (a few early samples may be dropped — harmless, and the
// main process no-ops them anyway).
let lslAvailable = false;
void window.electronAPI?.isLSLAvailable?.().then((ok) => {
  lslAvailable = ok;
});

/**
 * Transforms a raw EEG observable (per-sample EEGData) into an observable of
 * batched LSLEpoch objects ready to be forwarded over IPC.
 */
export const batchSamplesToEpoch = (
  rawObservable: Observable<EEGData>,
  deviceId: string,
  deviceType: LSLEpoch['deviceType'],
  channelNames: string[],
  sampleRate: number,
  batchSize: number = DEFAULT_BATCH_SIZE
): Observable<LSLEpoch> =>
  rawObservable.pipe(
    filter((s) => Array.isArray(s.data) && s.data.length === channelNames.length),
    bufferCount(batchSize),
    map((batch) => ({
      deviceId,
      deviceType,
      samples: batch.map((s) => s.data),
      timestamps: batch.map((s) => s.timestamp),
      channelNames,
      sampleRate,
    }))
  );

export const sendEpoch = (epoch: LSLEpoch): void => {
  if (!lslAvailable) return;
  window.electronAPI?.sendLSLEpoch?.(epoch);
};

export const sendMarker = (marker: LSLMarker): void => {
  if (!lslAvailable) return;
  window.electronAPI?.sendLSLMarker?.(marker);
};
