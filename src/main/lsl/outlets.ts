/**
 * LSL Outlet Manager.
 *
 * Creates and holds LSL StreamOutlets in the main process. Renderer forwards
 * batched EEG epochs (and markers) over IPC; this module pushes them onto the
 * LSL network where they can be recorded by LabRecorder or any LSL inlet.
 */
import log from 'electron-log';
import {
  StreamInfo,
  StreamOutlet,
  IRREGULAR_RATE,
} from 'node-labstreaminglayer';
import type { LSLEpoch } from '../../shared/lslTypes';

const MARKER_STREAM_NAME = 'BrainWavesMarkers';

class LSLOutletManager {
  private outlets = new Map<string, StreamOutlet>();
  private markerOutlet: StreamOutlet | null = null;

  /**
   * Create an EEG outlet for the given device. Safe to call repeatedly — a
   * second call with the same deviceId replaces the existing outlet.
   */
  createDeviceOutlet(
    deviceId: string,
    deviceType: string,
    channelNames: string[],
    sampleRate: number
  ): void {
    this.destroyDeviceOutlet(deviceId);

    const streamName = `BrainWaves-${deviceType}-${deviceId}`;
    const info = new StreamInfo(
      streamName,
      'EEG',
      channelNames.length,
      sampleRate,
      'float32',
      deviceId
    );
    info.setChannelLabels(channelNames);
    info.setChannelTypes('EEG');
    info.setChannelUnits('microvolts');

    const outlet = new StreamOutlet(info);
    this.outlets.set(deviceId, outlet);
    log.info(
      `[lsl] created EEG outlet ${streamName} (${channelNames.length}ch @ ${sampleRate}Hz)`
    );
  }

  /**
   * Push a batch of samples to the device outlet. If no outlet exists for the
   * epoch's deviceId, the outlet is created lazily from the epoch metadata.
   */
  pushEpoch(epoch: LSLEpoch): void {
    let outlet = this.outlets.get(epoch.deviceId);
    if (!outlet) {
      this.createDeviceOutlet(
        epoch.deviceId,
        epoch.deviceType,
        epoch.channelNames,
        epoch.sampleRate
      );
      outlet = this.outlets.get(epoch.deviceId);
      if (!outlet) return;
    }

    // LSL timestamps are in seconds; renderer provides ms from performance.now().
    const timestampsSec = epoch.timestamps.map((t) => t / 1000);
    outlet.pushChunk(epoch.samples, timestampsSec);
  }

  destroyDeviceOutlet(deviceId: string): void {
    const outlet = this.outlets.get(deviceId);
    if (outlet) {
      outlet.destroy();
      this.outlets.delete(deviceId);
      log.info(`[lsl] destroyed EEG outlet for ${deviceId}`);
    }
  }

  /**
   * Create the single marker outlet used for experiment stimulus markers.
   * IRREGULAR_RATE + string format = event-driven marker stream.
   */
  createMarkerOutlet(): void {
    if (this.markerOutlet) return;
    const info = new StreamInfo(
      MARKER_STREAM_NAME,
      'Markers',
      1,
      IRREGULAR_RATE,
      'string',
      'brainwaves-markers'
    );
    this.markerOutlet = new StreamOutlet(info);
    log.info(`[lsl] created marker outlet ${MARKER_STREAM_NAME}`);
  }

  pushMarker(label: string): void {
    if (!this.markerOutlet) this.createMarkerOutlet();
    this.markerOutlet?.pushSample([label]);
  }

  destroyAll(): void {
    for (const [id, outlet] of this.outlets) {
      outlet.destroy();
      log.info(`[lsl] destroyed outlet ${id} during cleanup`);
    }
    this.outlets.clear();
    if (this.markerOutlet) {
      this.markerOutlet.destroy();
      this.markerOutlet = null;
    }
  }
}

export const lslOutlets = new LSLOutletManager();
