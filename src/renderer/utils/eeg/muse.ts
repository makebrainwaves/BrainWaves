import { share, filter, map } from 'rxjs/operators';
import {
  addInfo,
  epoch,
  bandpassFilter,
  addSignalQuality,
} from '@neurosity/pipes';
import { MUSE_SERVICE, MuseClient, zipSamples } from 'muse-js';
import type { EEGReading, EEGSample } from 'muse-js';
import { from, Observable } from 'rxjs';
import { parseMuseSignalQuality } from './pipes';
import {
  MUSE_SAMPLING_RATE,
  MUSE_CHANNELS,
  PLOTTING_INTERVAL,
} from '../../constants/constants';
import { Device, DeviceInfo, EEGData } from '../../constants/interfaces';
import { createMarkerStamper, MarkerStamper } from './markerRegistry';
import { EEGDriver } from './types';

// Windows 7 check removed — process.platform and os.release are not available in renderer context

const client = new MuseClient();
client.enableAux = false;

// Stamps the shared marker timing rule onto the Muse sample stream
// (markerRegistry.createMarkerStamper).
let markerStamper: MarkerStamper | null = null;
const MUSE_SAMPLE_INTERVAL_MS = 1000 / MUSE_SAMPLING_RATE;
const MUSE_PACKET_SAMPLES = 12;
const MUSE_PACKET_MS = MUSE_PACKET_SAMPLES * MUSE_SAMPLE_INTERVAL_MS;
/** Arrival floors are kept per 64-packet (3 s) bucket, over the last 5 buckets. */
const CLOCK_BUCKET_PACKETS = 64;
const CLOCK_WINDOW_BUCKETS = 5;

/**
 * Assumed lag between a marker and the stimulus reaching the eye, subtracted
 * from sample times so markers land on the sample acquired as the image
 * appeared. Uncalibrated (see TODOS.md, "Calibrate marker latency"):
 * - 20 ms minimum Bluetooth and firmware delivery latency, the middle of the
 *   usual 10–30 ms range, which packet arrival times cannot reveal;
 * - 16.5 ms from lab.js `run` (when markers fire) to `show` (the image drawn),
 *   measured on a 120 Hz display; panel response is not included.
 * Chosen so a real run's Face dip at 215 ms lines up with the N170.
 */
export const MUSE_LATENCY_MS = 20 + 16.5;
/**
 * Puts Muse samples on this computer's clock using packet arrival times.
 *
 * muse-js stamps the first packet's arrival and then counts samples, so its
 * times carry that packet's Bluetooth delay and drift with the headset crystal
 * (one Muse ran 70 ppm fast: about +166 ms after 40 minutes connected).
 *
 * Model: packet n (16-bit index, unwrapped here with the help of arrival time)
 * is sent once its last sample is acquired, so `arrival − n × 46.875 ms` is
 * the clock offset plus Bluetooth latency plus jitter (≥ 0). The minimum over
 * the last 12–15 s cancels the jitter and follows crystal drift; the last
 * sample of a packet is placed on that floor. In simulation (0–30 ms jitter)
 * it is within one sample a second after the stream (re)starts.
 *
 * The floor is acquisition time plus the *minimum* Bluetooth and firmware
 * latency, which this data cannot see; `MUSE_LATENCY_MS` subtracts an assumed
 * value for it.
 */
const createMuseClock = () => {
  let lastIndex: number | null = null;
  let lastArrival = 0;
  const floors: { bucket: number; offset: number }[] = [];
  let offset = 0;
  return {
    /** Records a notification; returns its first sample's headset time in ms. */
    receive(rawIndex: number, arrival: number): number {
      const expected =
        lastIndex === null
          ? rawIndex
          : lastIndex + Math.round((arrival - lastArrival) / MUSE_PACKET_MS);
      const step = (rawIndex - expected) & 0xffff;
      const index = expected + (step < 0x8000 ? step : step - 0x10000);
      lastIndex = index;
      lastArrival = arrival;

      const headsetTime = index * MUSE_PACKET_MS;
      const observed =
        arrival -
        headsetTime -
        (MUSE_PACKET_SAMPLES - 1) * MUSE_SAMPLE_INTERVAL_MS;
      const bucket = Math.floor(index / CLOCK_BUCKET_PACKETS);
      const newest = floors[floors.length - 1];
      if (newest?.bucket === bucket) {
        newest.offset = Math.min(newest.offset, observed);
      } else if (!newest || bucket > newest.bucket) {
        floors.push({ bucket, offset: observed });
      }
      while (floors[0].bucket <= bucket - CLOCK_WINDOW_BUCKETS) floors.shift();
      offset = floors.reduce(
        (min, floor) => Math.min(min, floor.offset),
        Infinity
      );
      return headsetTime;
    },
    /** Headset time in ms → this computer's clock. */
    toWallClock: (headsetTime: number) =>
      headsetTime + offset - MUSE_LATENCY_MS,
  };
};

// Cached BluetoothDevice from the last getMuse() scan so that connectToMuse()
// can reuse it without triggering a second requestDevice() call (which would
// fire another select-bluetooth-device event in the main process).
let cachedDevice: BluetoothDevice | null = null;

// Gets an available Muse device. In Electron, requestDevice() triggers the
// select-bluetooth-device IPC event in the main process, which auto-selects
// the first Muse headset found via BLE.
// TODO: is being able to request only one Muse at a time a problem in a classroom scenario?
export const getMuse = async () => {
  const deviceInstance = await navigator.bluetooth.requestDevice({
    filters: [{ services: [MUSE_SERVICE] }],
  });
  cachedDevice = deviceInstance;
  return [{ id: deviceInstance.id, name: deviceInstance.name }];
};

// Attempts to connect to a muse device. If successful, returns a device info object.
// Reuses the BluetoothDevice cached by getMuse() to avoid a redundant requestDevice() call.
export const connectToMuse = async (device: Device) => {
  const deviceInstance =
    cachedDevice ??
    (await navigator.bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE], name: device.name }],
    }));
  cachedDevice = null;
  const gatt = await deviceInstance.gatt?.connect();
  await client.connect(gatt);
  return {
    name: client.deviceName,
    samplingRate: MUSE_SAMPLING_RATE,
    channels: MUSE_CHANNELS,
  };
};

export const disconnectFromMuse = () => {
  cachedDevice = null;
  markerStamper = null;
  client.disconnect();
};

// Emits when the BLE connection drops after having been up. Intentionally
// ignores the initial `false` from BehaviorSubject — we only care about
// transitions from connected → disconnected.
// muse-js bundles its own rxjs; bridge into this app's rxjs via a thin wrapper.
export const museDisconnect$: Observable<void> = new Observable<void>(
  (subscriber) => {
    const sub = (
      client.connectionStatus as unknown as {
        subscribe: (n: (v: boolean) => void) => { unsubscribe: () => void };
      }
    ).subscribe(
      (() => {
        let prev: boolean | undefined;
        return (curr: boolean) => {
          if (prev === true && curr === false) subscriber.next();
          prev = curr;
        };
      })()
    );
    return () => sub.unsubscribe();
  }
);

// Cancels any in-progress BLE scan by telling the main process to reject the
// pending requestDevice() call. Called when the student cancels the search.
export const cancelMuseScan = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electronAPI?.cancelBluetoothSearch();
};

// Awaits Muse connectivity before sending an observable rep. EEG stream. Each
// reading's muse-js timestamp is replaced by headset time before zipSamples
// (which groups by it), and zipped samples are mapped to the wall clock.
// muse-js takes and returns its bundled rxjs 6 Observables: they interoperate
// with this app's rxjs at runtime (Symbol.observable) but not in the types.
export const createRawMuseObservable = async () => {
  await client.start();
  const stamper = createMarkerStamper(MUSE_SAMPLE_INTERVAL_MS);
  markerStamper = stamper;
  const clock = createMuseClock();
  const eegReadings = client.eegReadings as unknown as Observable<EEGReading>;
  const readings = from(eegReadings).pipe(
    map((reading) => ({
      ...reading,
      timestamp: clock.receive(reading.index, Date.now()),
    }))
  );
  const samples = zipSamples(
    readings as unknown as Parameters<typeof zipSamples>[0]
  ) as unknown as Observable<EEGSample>;
  return from(samples).pipe(
    // Remove nans if present (muse 2)
    map((sample) => ({
      ...sample,
      timestamp: clock.toWallClock(sample.timestamp),
      data: sample.data.filter((val) => !Number.isNaN(val)),
    })),
    filter((sample) => sample.data.length >= 4),
    map((sample: EEGData) => stamper.stamp(sample)),
    share()
  );
};

// Creates an observable that will epoch, filter, and add signal quality to EEG stream
export const createMuseSignalQualityObservable = (
  rawObservable: Observable<EEGData>,
  deviceInfo
) => {
  const { samplingRate, channels: channelNames } = deviceInfo;
  const intervalSamples = (PLOTTING_INTERVAL * samplingRate) / 1000;
  return rawObservable.pipe(
    addInfo({
      samplingRate,
      channelNames,
    }),
    epoch({
      duration: intervalSamples,
      interval: intervalSamples,
    }),
    bandpassFilter({
      nbChannels: channelNames.length,
      cutoffFrequencies: [1, 50],
    }),
    addSignalQuality(),
    parseMuseSignalQuality()
  );
};

// Injects an event marker by queueing it for the EEG sample whose interval
// contains the marker timestamp. The timestamp argument (from the runtime
// callback) is aligned against each sample's timestamp for bounded error.
export const injectMuseMarker = (code: number, timestamp: number) => {
  markerStamper?.inject(code, timestamp);
};

// The Muse implementation of the shared device-driver contract. deviceEpics
// resolves this via the registry in ./index rather than branching on deviceType.
export const museDriver: EEGDriver = {
  scan: getMuse,
  connect: (device: Device) =>
    connectToMuse(device) as Promise<DeviceInfo | null>,
  disconnect: disconnectFromMuse,
  cancelScan: cancelMuseScan,
  createRawObservable: createRawMuseObservable,
  injectMarker: injectMuseMarker,
  disconnect$: () => museDisconnect$,
};
