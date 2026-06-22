/**
 * Shared device-driver contract.
 *
 * Every first-party EEG backend (Muse, Neurosity) implements this single
 * interface so that deviceEpics can treat them uniformly — connect, stream,
 * tear down, and (critically) inject experiment markers — without branching
 * on `deviceType`. The one cross-cutting concern that matters most for the
 * science, getting a stimulus marker time-locked into the recorded stream,
 * lives here so a new device physically cannot be added without implementing
 * it (the bug that left Neurosity recordings marker-less).
 *
 *        deviceEpics ──getDriver(deviceType)──> EEGDriver
 *                                                  │
 *                        ┌─────────────────────────┼──────────────┐
 *                        ▼                          ▼              ▼
 *                    scan/connect           createRawObservable  injectMarker
 *
 * LSL inlet recording is a separate mode (its discovery returns LSL
 * `DiscoveredStream`s, not BLE `Device`s) and keeps its own dedicated epics,
 * so it is intentionally NOT part of this interface.
 */
import { Observable } from 'rxjs';
import { Device, DeviceInfo, EEGData } from '../../constants/interfaces';

export interface EEGDriver {
  /** Trigger a Web Bluetooth scan; resolves to the discovered device(s). */
  scan(): Promise<Device[]>;
  /** Connect to a discovered device; resolves to its info, or null on failure. */
  connect(device: Device): Promise<DeviceInfo | null>;
  /** Tear down the active connection and any subscriptions. */
  disconnect(): void | Promise<void>;
  /** Cancel an in-progress scan (called when the search timer expires). */
  cancelScan(): void;
  /** Build the per-sample raw EEG observable for the active connection. */
  createRawObservable(): Promise<Observable<EEGData>>;
  /**
   * Inject an experiment marker (numeric event code) so it lands on the
   * recorded sample stream time-locked to `time` (ms). This is what makes a
   * recording usable for ERP derivation.
   */
  injectMarker(code: number, time: number): void;
  /**
   * Emits once when the device unexpectedly disconnects after having been
   * connected. Used by deviceEpics to surface DeviceLost.
   */
  disconnect$(): Observable<void>;
}
