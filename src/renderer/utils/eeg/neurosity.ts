/**
 * Neurosity Crown driver.
 *
 * Mirrors the interface of muse.ts so that deviceEpics can swap between the
 * two drivers based on `deviceType`. The Crown streams EEG as epochs (data is
 * organized per-channel); we flatten to per-sample emissions to match the
 * `EEGData` shape that the rest of the app expects.
 */
import { Neurosity } from '@neurosity/sdk';
import { Observable, Subject } from 'rxjs';
import { filter as rxFilter, map as rxMap, share } from 'rxjs/operators';
import {
  NEUROSITY_CHANNELS,
  NEUROSITY_SAMPLING_RATE,
} from '../../constants/constants';
import { Device, DeviceInfo, EEGData } from '../../constants/interfaces';
import { EEGDriver } from './types';

// A single SDK client per renderer (Crown BLE allows one consumer at a time).
// Constructing with `autoSelectDevice: false` keeps us responsible for
// explicit connect / disconnect via Web Bluetooth.
let neurosity: Neurosity | null = null;
let cachedDevice: BluetoothDevice | null = null;
let brainwavesSubscription: { unsubscribe: () => void } | null = null;
let markerSubject: Subject<EEGData> | null = null;

// The Crown SDK has no native event-marker stream (unlike muse-js). We hold the
// most recently injected marker code here and attach it to the next sample
// emitted from the brainwaves loop, then clear it — so a stimulus marker lands
// on the recorded stream with at most one epoch of latency. Without this,
// Neurosity recordings carry an all-zero Marker column and cannot yield ERPs.
let pendingMarker: number | null = null;

const getClient = (): Neurosity => {
  if (!neurosity) {
    neurosity = new Neurosity({
      autoSelectDevice: false,
      streamingMode: 'bluetooth-with-wifi-fallback' as unknown as undefined,
    } as unknown as Parameters<typeof Neurosity>[0]);
  }
  return neurosity;
};

/**
 * Initiate a Web Bluetooth scan for a Neurosity Crown. The main-process
 * `select-bluetooth-device` handler picks the first matching device.
 */
export const getNeurosity = async (): Promise<Device[]> => {
  const client = getClient();
  const device = await client.bluetooth.requestDevice();
  cachedDevice = device as unknown as BluetoothDevice;
  return [{ id: (device as BluetoothDevice).id, name: (device as BluetoothDevice).name }];
};

/**
 * Connect to a previously discovered Crown and return a DeviceInfo describing
 * its sampling rate and channel layout.
 */
export const connectToNeurosity = async (_device: Device) => {
  const client = getClient();
  await client.bluetooth.connect();
  cachedDevice = null;
  return {
    name: 'Neurosity Crown',
    samplingRate: NEUROSITY_SAMPLING_RATE,
    channels: NEUROSITY_CHANNELS,
  };
};

export const disconnectFromNeurosity = async (): Promise<void> => {
  brainwavesSubscription?.unsubscribe();
  brainwavesSubscription = null;
  markerSubject?.complete();
  markerSubject = null;
  pendingMarker = null;
  cachedDevice = null;
  if (neurosity) {
    try {
      await neurosity.disconnect();
    } catch {
      // best-effort teardown
    }
  }
};

export const cancelNeurosityScan = (): void => {
  window.electronAPI?.cancelBluetoothSearch?.();
};

/**
 * Emits when the Crown transitions to OFFLINE. Used by deviceEpics to dispatch
 * DeviceLost so Redux state and the UI can react to an unexpected disconnect.
 */
export const neurosityDisconnect$ = (): Observable<void> => {
  const client = getClient();
  return (
    client.status() as unknown as Observable<{ state: string }>
  ).pipe(
    rxFilter((s) => s?.state === 'offline'),
    rxMap(() => undefined)
  );
};

/**
 * Subscribe to `brainwaves('raw')` and flatten each Crown epoch into
 * per-sample EEGData events, matching the shape of `createRawMuseObservable()`.
 */
export const createRawNeurosityObservable = async (): Promise<
  Observable<EEGData>
> => {
  const client = getClient();
  const subject = new Subject<EEGData>();
  markerSubject = subject;

  // brainwaves('raw') emits Epoch { data: number[][] (channels×samples), info }
  const stream = client.brainwaves('raw') as unknown as Observable<{
    data: number[][];
    info: { samplingRate: number; startTime: number; channelNames?: string[] };
  }>;

  brainwavesSubscription = stream.subscribe({
    next: (epoch) => {
      const { data, info } = epoch;
      if (!data || data.length === 0) return;
      const sampleCount = data[0].length;
      const sampleIntervalMs = 1000 / (info.samplingRate || NEUROSITY_SAMPLING_RATE);
      for (let i = 0; i < sampleCount; i++) {
        const sample: number[] = [];
        for (let c = 0; c < data.length; c++) {
          sample.push(data[c][i]);
        }
        const eegData: EEGData = {
          data: sample,
          timestamp: info.startTime + i * sampleIntervalMs,
        };
        // Attach a pending marker to the first sample after injectMarker() was
        // called, then clear it so only one sample carries the event code.
        if (pendingMarker !== null) {
          eegData.marker = pendingMarker;
          pendingMarker = null;
        }
        subject.next(eegData);
      }
    },
    error: (err) => subject.error(err),
  });

  return subject.asObservable().pipe(share()) as Observable<EEGData>;
};

/**
 * Queue a marker code to be attached to the next emitted sample. No-ops if no
 * raw stream is active (markers injected before recording starts are dropped,
 * matching the Muse behaviour).
 */
export const injectNeurosityMarker = (code: number, _time: number): void => {
  if (!markerSubject) return;
  pendingMarker = code;
};

// The Neurosity implementation of the shared device-driver contract.
export const neurosityDriver: EEGDriver = {
  scan: getNeurosity,
  connect: (device: Device) =>
    connectToNeurosity(device) as Promise<DeviceInfo | null>,
  disconnect: disconnectFromNeurosity,
  cancelScan: cancelNeurosityScan,
  createRawObservable: createRawNeurosityObservable,
  injectMarker: injectNeurosityMarker,
  disconnect$: neurosityDisconnect$,
};
