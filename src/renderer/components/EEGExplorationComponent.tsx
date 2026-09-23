import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Observable, shareReplay } from 'rxjs';
import { Button } from './ui/button';
import {
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
  MUSE_CHANNELS,
  MUSE_SAMPLING_RATE,
  VIEWER_DEFAULTS,
} from '../constants/constants';
import eegImage from '../assets/common/EEG.png';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import ViewerComponent from './ViewerComponent';
import { HeadsetSetupContext } from '../containers/AppShellContainer';
import ExploreSensorCard from './ExploreSensorCard';
import ExploreLessonFlow from './ExploreLessonFlow';
import { EXPLORE_LESSONS, LessonId } from '../constants/exploreLessons';
import { ExploreSession } from '../utils/eeg/exploreSignal';
import { DeviceActions } from '../actions';
import { DeviceInfo, SignalQualityData } from '../constants/interfaces';

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
  onDisconnect,
}: {
  observable?: Observable<SignalQualityData>;
  device: DeviceInfo | null | undefined;
  onDisconnect: () => void;
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
  const [streamError, setStreamError] = useState('');
  const [activeLesson, setActiveLesson] = useState<LessonId | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  useEffect(() => {
    setSample(null);
    setStreamError('');
    const subscription = stream?.subscribe({
      next: (chunk) => {
        session.consume(chunk);
        setSample(chunk);
      },
      error: () =>
        setStreamError(
          'The signal stream stopped. Disconnect and reconnect your headset.'
        ),
    });
    return () => subscription?.unsubscribe();
  }, [stream, session]);

  function startLesson(lesson: LessonId) {
    if (lesson === 'noise-sources') session.reset();
    setHoveredChannel(null);
    setActiveLesson(lesson);
  }

  return (
    <div className="flex min-h-full flex-col text-ink" data-explore-connected>
      {streamError && (
        <div role="alert" className="mb-3 text-sm">
          {streamError}
        </div>
      )}
      <div
        className={
          activeLesson ? 'hidden' : 'flex min-h-full flex-1 flex-col gap-5'
        }
      >
        <div className="flex flex-none justify-end">
          <Button variant="outline-brand" onClick={onDisconnect}>
            Disconnect EEG Device
          </Button>
        </div>
        <div
          className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] gap-7 max-[620px]:grid-cols-1"
          data-explore-surface
        >
          <div className="flex min-w-0 flex-col gap-3.5">
            <SignalQualityIndicatorComponent
              signalQualityObservable={stream}
              plottingInterval={PLOTTING_INTERVAL}
              height={250}
              channels={channels}
              hoveredChannel={hoveredChannel}
              onHoveredChannelChange={setHoveredChannel}
            />
            <ExploreSensorCard
              channels={channels}
              sample={sample}
              hoveredChannel={hoveredChannel}
              onHoveredChannelChange={setHoveredChannel}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <div
              className="relative min-h-0 flex-1 rounded-lg border border-gray-200 bg-white px-[18px] py-4"
              data-explore-trace
            >
              {!activeLesson && (
                <ViewerComponent
                  signalQualityObservable={stream}
                  channels={channels}
                  plottingInterval={PLOTTING_INTERVAL}
                  height="100%"
                />
              )}
              {!sample && (
                <div
                  role="status"
                  className="absolute inset-x-[18px] top-4 text-sm text-ink-muted"
                >
                  Waiting for the headset signal…
                </div>
              )}
            </div>
            <section
              className="flex flex-none flex-col gap-2.5"
              aria-labelledby="explore-lessons"
              data-explore-lessons
            >
              <div
                id="explore-lessons"
                className="text-[13px] font-bold tracking-[0.5px] text-ink-muted"
              >
                LEARN WITH THIS SIGNAL
              </div>
              <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
                {EXPLORE_LESSONS.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="min-w-0">
                      <div className="text-lg tracking-[0.3px]">
                        {lesson.title}
                      </div>
                      <div className="text-sm text-ink-muted">
                        {lesson.detail}
                      </div>
                    </div>
                    <Button
                      variant="outline-brand"
                      className="ml-auto flex-none"
                      aria-label={`Start ${lesson.title}`}
                      onClick={() => startLesson(lesson.id)}
                    >
                      Start
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      {activeLesson && (
        <ExploreLessonFlow
          lesson={activeLesson}
          stream={stream}
          channels={channels}
          samplingRate={samplingRate}
          session={session}
          sample={sample}
          onExit={() => setActiveLesson(null)}
        />
      )}
    </div>
  );
}

export default function EEGExplorationComponent(props: Props) {
  const { openHeadsetSetup } = useContext(HeadsetSetupContext);
  const connected = props.connectionStatus === CONNECTION_STATUS.CONNECTED;

  return (
    <div className="h-[90%] min-h-[560px]">
      {connected ? (
        <ConnectedExplore
          observable={props.signalQualityObservable}
          device={props.connectedDevice}
          onDisconnect={() => props.DeviceActions.DisconnectFromDevice()}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-ink">
          <div className="flex max-w-[880px] items-center justify-center gap-14 max-[740px]:flex-col max-[740px]:gap-7">
            <img
              src={eegImage}
              alt="EEG headset"
              className="h-auto w-[300px] flex-none"
            />
            <div className="flex max-w-[440px] flex-col items-start gap-[18px]">
              <div className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
                RAW SIGNAL
              </div>
              <h1>Explore Raw EEG</h1>
              <p className="leading-7">
                Connect a headset and watch your brain&apos;s electricity show
                up live — no experiment to set up, no data to save.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={openHeadsetSetup}>
                  Connect a headset
                </Button>
                <span className="text-sm text-ink-muted">
                  Takes about 30 seconds
                </span>
              </div>
              <div className="mt-2 flex w-full flex-col gap-1.5 border-t border-gray-200 pt-[18px]">
                <div className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
                  ONCE YOU&apos;RE CONNECTED
                </div>
                <div className="text-base tracking-[0.3px]">
                  Two short lessons are waiting: improving signal quality, and
                  where noise comes from.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
