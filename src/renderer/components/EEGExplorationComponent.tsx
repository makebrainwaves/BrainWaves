import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Observable, shareReplay } from 'rxjs';
import {
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
  MUSE_CHANNELS,
  MUSE_SAMPLING_RATE,
  VIEWER_DEFAULTS,
} from '../constants/constants';
import ViewerComponent from './ViewerComponent';
import { HeadsetSetupContext } from '../containers/AppShellContainer';
import ExploreLessonFlow from './ExploreLessonFlow';
import LiveSignalPrep from './HeadsetSetup/LiveSignalPrep';
import { LessonId } from '../constants/exploreLessons';
import { ExploreSession, FRONTAL } from '../utils/eeg/exploreSignal';
import { DeviceActions } from '../actions';
import { DeviceInfo, SignalQualityData } from '../constants/interfaces';
import { ExploreDisconnected, ExploreSurface } from './Explore/ExploreScreens';
import { ErrorBanner } from './Explore/ExploreParts';
import { summarizeQuality } from './Explore/quality';

interface Props {
  connectedDevice: DeviceInfo | null | undefined;
  signalQualityObservable?: Observable<SignalQualityData>;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
}

/** Holds the stream and bounded lesson buffer for the entire connected visit. */
function ConnectedExplore({
  observable,
  device,
  onReconnect,
  onSwitchHeadset,
}: {
  observable?: Observable<SignalQualityData>;
  device: DeviceInfo | null | undefined;
  /** "Reconnect headset" on the stream-stopped banner. */
  onReconnect: () => void;
  /** "Switch headset" on the unsupported-channels banner. */
  onSwitchHeadset: () => void;
}) {
  const channels = device?.channels ?? MUSE_CHANNELS;
  const samplingRate = device?.samplingRate ?? MUSE_SAMPLING_RATE;
  // Replay a full plot window so a viewer mounted mid-visit draws a filled
  // trace immediately instead of one 250 ms sliver.
  const stream = useMemo(
    () =>
      observable?.pipe(
        shareReplay({
          bufferSize: Math.ceil(VIEWER_DEFAULTS.domain / PLOTTING_INTERVAL),
          refCount: true,
        })
      ),
    [observable]
  );
  const session = useMemo(
    () => new ExploreSession(channels, samplingRate),
    [channels, samplingRate]
  );
  const [sample, setSample] = useState<SignalQualityData | null>(null);
  const [streamStopped, setStreamStopped] = useState(false);
  const [activeLesson, setActiveLesson] = useState<LessonId | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  useEffect(() => {
    setSample(null);
    setStreamStopped(false);
    const subscription = stream?.subscribe({
      next: (chunk) => {
        session.consume(chunk);
        setSample(chunk);
      },
      error: () => setStreamStopped(true),
      complete: () => setStreamStopped(true),
    });
    return () => subscription?.unsubscribe();
  }, [stream, session]);

  function startLesson(lesson: LessonId) {
    if (lesson === 'noise-sources') session.reset();
    setHoveredChannel(null);
    setActiveLesson(lesson);
  }

  const legend = `${device?.name ?? ''} · ${samplingRate} Hz`;
  const { state, sensors } = summarizeQuality(sample?.signalQuality, channels);
  const missing = FRONTAL.filter((channel) => !channels.includes(channel));
  return (
    <div className="flex h-full min-h-0 flex-col">
      {streamStopped && (
        <div className="flex flex-none flex-col px-[24px] pt-[10px]">
          <ErrorBanner
            title="The signal stream stopped."
            body="The headset is still connected, but its data stream ended. Disconnect and reconnect to start it again."
            actionLabel="Reconnect headset"
            onAction={onReconnect}
          />
        </div>
      )}
      <div className="min-h-0 flex-1">
        {activeLesson ? (
          <ExploreLessonFlow
            lesson={activeLesson}
            stream={stream}
            channels={channels}
            legend={legend}
            session={session}
            sample={sample}
            onExit={() => setActiveLesson(null)}
          />
        ) : (
          <ExploreSurface
            quality={sample ? state : 'waiting'}
            sensors={sensors}
            channels={channels}
            sample={sample}
            head={stream}
            livePlot={
              <ViewerComponent
                signalQualityObservable={stream}
                channels={channels}
                plottingInterval={PLOTTING_INTERVAL}
                height="100%"
              />
            }
            legend={legend}
            hoveredChannel={hoveredChannel}
            onHoveredChannelChange={setHoveredChannel}
            onStartLesson={startLesson}
            banner={
              !streamStopped &&
              !session.status().supported &&
              missing.length ? (
                <ErrorBanner
                  title={`This headset is not reporting ${new Intl.ListFormat('en').format(missing)}.`}
                  body="Blink detection needs both AF7 and AF8, so the blink steps will show your signal without blink marks — or pick a headset with both forehead sensors. The eyes-closed activity works either way."
                  actionLabel="Switch headset"
                  onAction={onSwitchHeadset}
                />
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

export default function EEGExplorationComponent(props: Props) {
  const { openHeadsetSetup, signalPrep, finishSignalPrep } =
    useContext(HeadsetSetupContext);
  const connected = props.connectionStatus === CONNECTION_STATUS.CONNECTED;

  return (
    <div className="h-full">
      {connected && signalPrep ? (
        <LiveSignalPrep
          device={signalPrep}
          observable={props.signalQualityObservable}
          channels={props.connectedDevice?.channels ?? []}
          onContinue={finishSignalPrep}
        />
      ) : connected ? (
        <ConnectedExplore
          observable={props.signalQualityObservable}
          device={props.connectedDevice}
          onReconnect={() => {
            props.DeviceActions.DisconnectFromDevice();
            openHeadsetSetup();
          }}
          onSwitchHeadset={openHeadsetSetup}
        />
      ) : (
        <ExploreDisconnected onConnect={openHeadsetSetup} />
      )}
    </div>
  );
}
