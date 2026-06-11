/**
 * Functions for writing EEG data to disk.
 * The actual write stream lives in the main process; the renderer
 * communicates via the IPC bridge in window.electronAPI.
 */

import { EEGData } from '../../constants/interfaces';

// Creates an EEG write stream in the main process and returns a stream ID
export const createEEGWriteStream = (
  title: string,
  subject: string,
  group: string,
  session: number
): Promise<string> =>
  window.electronAPI.createEEGWriteStream(title, subject, group, session);

// Writes the CSV header row to the stream identified by streamId
export const writeHeader = (streamId: string, channels: string[]): void =>
  window.electronAPI.writeEEGHeader(streamId, channels);

// Writes a single EEG data row (fire-and-forget for performance)
export const writeEEGData = (streamId: string, eegData: EEGData): void =>
  window.electronAPI.writeEEGData(streamId, eegData);

// Closes the write stream
export const closeEEGStream = (streamId: string): Promise<void> =>
  window.electronAPI.closeEEGStream(streamId);

// Writes the code->label event sidecar JSON alongside the raw CSV so the
// numeric Marker codes are interpretable without the app (and by validation
// tests that read recordings back).
export const writeEEGEvents = (
  title: string,
  subject: string,
  group: string,
  session: number,
  events: Record<number, string>
): Promise<void> =>
  window.electronAPI.writeEEGEvents(title, subject, group, session, events);
