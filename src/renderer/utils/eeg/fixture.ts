/**
 * Fixture / Replay EEG Driver
 *
 * Replays a checked-in CSV of synthetic EEG samples as a live
 * Observable<EEGData>, enabling full-stack playtesting (Collect → Clean →
 * Analyze) without a physical headset on the desk.
 *
 * The CSV is bundled at build time via Vite's ?raw import and parsed on first
 * use. Samples are stamped on a 256 Hz grid anchored to Date.now(), so the
 * signal-quality pipeline and marker-injection contract work identically to a
 * live BLE device.
 *
 * Design notes
 * ------------
 * - scan() returns a synthetic device instantly (no BLE needed).
 * - connect() resolves immediately with a fixed DeviceInfo (4 ch, 256 Hz).
 * - createRawObservable() loops the CSV continuously so the stream never dries.
 *   Each timer tick emits every sample now due, so a late or throttled timer
 *   never lets the stream clock fall behind the wall-clock marker timestamps.
 * - The CSV's marker column is ignored: replaying it would add events the app
 *   never sent, so a run's markers are exactly the ones injectMarker() stamps.
 * - injectMarker() queues a code onto the next emitted sample (Neurosity-style).
 * - disconnect$() never emits — the fixture cannot "unexpectedly disconnect".
 */
import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import { Device, DeviceInfo, EEGData } from '../../constants/interfaces';
import { EEGDriver } from './types';
import fixtureCsv from './fixture_data.csv?raw';
import { createMarkerStamper, MarkerStamper } from './markerRegistry';

const CHANNEL_NAMES = ['TP9', 'AF7', 'AF8', 'TP10'];
const SAMPLING_RATE = 256;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLING_RATE;
const FIXTURE_DEVICE_ID = 'fixture-synthetic-eeg';

/** One replayed sample: TP9, AF7, AF8, TP10. */
type CsvRow = number[];

// ---------------------------------------------------------------------------
// Module-level state (single active connection per renderer, like BLE drivers)
// ---------------------------------------------------------------------------
let parsedRows: CsvRow[] | null = null;
let activeInterval: ReturnType<typeof setInterval> | null = null;
let sampleSubject: Subject<EEGData> | null = null;
let markerStamper: MarkerStamper | null = null;
let disconnectSubject: Subject<void> | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Parse the bundled CSV into an array of typed rows. Idempotent. */
function parseFixtureCsv(): CsvRow[] {
  if (parsedRows) return parsedRows;

  const lines = fixtureCsv.trim().split('\n');
  // Header: timestamp_ms,TP9,AF7,AF8,TP10,marker
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue; // malformed row
    rows.push([
      parseFloat(parts[1]),
      parseFloat(parts[2]),
      parseFloat(parts[3]),
      parseFloat(parts[4]),
    ]);
  }

  parsedRows = rows;
  return rows;
}

/** Tear down any active replay interval and subject. */
function stopReplay(): void {
  if (activeInterval !== null) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  if (sampleSubject !== null) {
    sampleSubject.complete();
    sampleSubject = null;
  }
  markerStamper = null;
}

// ---------------------------------------------------------------------------
// Public API  (exported individually for testing, and collected into fixtureDriver)
// ---------------------------------------------------------------------------

/**
 * "Scan" for fixture devices — synchronously returns a single synthetic device.
 */
export const getFixture = async (): Promise<Device[]> => {
  return [{ name: 'Fixture (Synthetic EEG)', id: FIXTURE_DEVICE_ID }];
};

/**
 * "Connect" to the fixture — always succeeds instantly.
 */
export const connectToFixture = async (
  _device: Device
): Promise<DeviceInfo | null> => {
  return {
    name: 'Fixture (Synthetic EEG)',
    samplingRate: SAMPLING_RATE,
    channels: [...CHANNEL_NAMES],
  };
};

/** Clean up the replay interval and subjects. */
export const disconnectFromFixture = (): void => {
  stopReplay();
};

/** Cancel scan is a no-op for the fixture driver. */
export const cancelFixtureScan = (): void => {
  /* no-op */
};

/**
 * Emits once when the device unexpectedly disconnects.
 * The fixture never disconnects, so this Subject never emits.
 */
export const fixtureDisconnect$ = (): Observable<void> => {
  if (!disconnectSubject) {
    disconnectSubject = new Subject<void>();
  }
  return disconnectSubject.asObservable();
};

/**
 * Build a live Observable<EEGData> that replays the bundled CSV in real time.
 * Loops continuously when the CSV is exhausted.
 */
export const createRawFixtureObservable = async (): Promise<
  Observable<EEGData>
> => {
  // Tear down any previous replay before creating a new one.
  stopReplay();

  const rows = parseFixtureCsv();
  if (rows.length === 0) {
    throw new Error('fixture_data.csv is empty — cannot create raw observable');
  }

  const subject = new Subject<EEGData>();
  sampleSubject = subject;
  const stamper = createMarkerStamper(SAMPLE_INTERVAL_MS);
  markerStamper = stamper;

  const startTime = Date.now();
  let sampleCount = 0;

  activeInterval = setInterval(() => {
    const due = Math.round((Date.now() - startTime) / SAMPLE_INTERVAL_MS);
    for (; sampleCount < due; sampleCount++) {
      subject.next(
        stamper.stamp({
          data: [...rows[sampleCount % rows.length]],
          timestamp: startTime + sampleCount * SAMPLE_INTERVAL_MS,
        })
      );
    }
  }, SAMPLE_INTERVAL_MS);

  return subject.asObservable().pipe(share()) as Observable<EEGData>;
};

/**
 * Queue a marker for the shared timing rule (one stamped sample). No-ops if no
 * raw stream is active (matching Muse / Neurosity behaviour).
 */
export const injectFixtureMarker = (code: number, time: number): void => {
  if (!sampleSubject) return;
  markerStamper?.inject(code, time);
};

// ---------------------------------------------------------------------------
// EEGDriver contract
// ---------------------------------------------------------------------------

export const fixtureDriver: EEGDriver = {
  scan: getFixture,
  connect: (device: Device) =>
    connectToFixture(device) as Promise<DeviceInfo | null>,
  disconnect: disconnectFromFixture,
  cancelScan: cancelFixtureScan,
  createRawObservable: createRawFixtureObservable,
  injectMarker: injectFixtureMarker,
  disconnect$: fixtureDisconnect$,
};
