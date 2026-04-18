/**
 * LSL Inlet Manager.
 *
 * Resolves LSL streams on the local network, opens inlets, and forwards
 * pulled samples to the renderer over IPC. Used by the "External LSL Device"
 * path where EEG originates on another machine / process (OpenBCI, BrainFlow,
 * pylsl, etc.).
 */
import log from 'electron-log';
import {
  resolveStreams,
  StreamInfo,
  StreamInlet,
} from 'node-labstreaminglayer';
import type { DiscoveredStream, LSLInletEpoch } from '../../shared/lslTypes';

const POLL_INTERVAL_MS = 16; // ~60Hz poll

class LSLInletManager {
  private inlets = new Map<
    string,
    { inlet: StreamInlet; info: StreamInfo; timer: NodeJS.Timeout }
  >();
  // Cache StreamInfo objects by uid so subscribe() can instantiate a
  // StreamInlet without a second resolveStreams() round-trip.
  private discoveredInfos = new Map<string, StreamInfo>();

  discoverStreams(waitTime: number = 1.0): DiscoveredStream[] {
    // Free any StreamInfos we cached but never subscribed to on the previous
    // scan so we don't leak their C handles.
    for (const [uid, info] of this.discoveredInfos) {
      if (!this.inlets.has(uid)) info.destroy();
    }
    this.discoveredInfos.clear();

    const streams = resolveStreams(waitTime);
    const results: DiscoveredStream[] = [];
    for (const info of streams) {
      const uid = info.uid();
      this.discoveredInfos.set(uid, info);
      results.push({
        uid,
        name: info.name(),
        type: info.type(),
        channelCount: info.channelCount(),
        sampleRate: info.nominalSrate(),
        sourceId: info.sourceId(),
      });
    }
    return results;
  }

  subscribeStream(
    uid: string,
    onData: (epoch: LSLInletEpoch) => void,
    onDisconnected?: () => void
  ): boolean {
    if (this.inlets.has(uid)) return true;
    const info = this.discoveredInfos.get(uid);
    if (!info) {
      log.warn(`[lsl] subscribeStream: unknown uid ${uid} — discover first`);
      return false;
    }

    const inlet = new StreamInlet(info);
    try {
      inlet.openStream(5);
    } catch (err) {
      log.error(`[lsl] failed to open inlet for ${uid}`, err);
      inlet.destroy();
      return false;
    }

    const timer = setInterval(() => {
      try {
        const [samples, timestamps] = inlet.pullChunk(0);
        if (samples && samples.length > 0 && timestamps.length > 0) {
          onData({ uid, samples, timestamps });
        }
      } catch (err) {
        log.error(`[lsl] inlet ${uid} poll failed`, err);
        clearInterval(timer);
        this.unsubscribeStream(uid);
        onDisconnected?.();
      }
    }, POLL_INTERVAL_MS);

    this.inlets.set(uid, { inlet, info, timer });
    log.info(`[lsl] subscribed to inlet ${info.name()} (${uid})`);
    return true;
  }

  unsubscribeStream(uid: string): void {
    const entry = this.inlets.get(uid);
    if (!entry) return;
    clearInterval(entry.timer);
    try {
      entry.inlet.closeStream();
    } catch {
      // best-effort close — destroy() still frees the handle
    }
    entry.inlet.destroy();
    this.inlets.delete(uid);
    log.info(`[lsl] unsubscribed from inlet ${uid}`);
  }

  destroyAll(): void {
    for (const uid of Array.from(this.inlets.keys())) {
      this.unsubscribeStream(uid);
    }
    for (const info of this.discoveredInfos.values()) {
      info.destroy();
    }
    this.discoveredInfos.clear();
  }
}

export const lslInlets = new LSLInletManager();
