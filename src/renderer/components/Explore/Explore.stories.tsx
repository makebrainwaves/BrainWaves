import React from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';
import { of } from 'rxjs';
import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import { channelColors } from '../../utils/eeg/traceColors';
import AppShell from '../AppShell/AppShell';
import type { DeviceState } from '../AppShell/types';
import {
  BLINK_MANY,
  BLINK_MANY_ALL,
  BLINK_MANY_ANNOTATIONS,
  BLINK_ONE,
  BLINK_ONE_ANNOTATIONS,
  BLINK_PREDICT,
  BLINK_PREDICT_ANNOTATIONS,
  BLINKING_SNAPSHOT,
  CALM_SNAPSHOT,
  CLOSED_SEGMENT,
  COMPARISON_RATIO,
  EXPLORE_CHANNELS,
  EYES_CLOSED_LIVE,
  LIVE_SNAPSHOT,
  NO_AF8_SENSORS,
  NO_AF8_SNAPSHOT,
  NO_SIGNAL_SNAPSHOT,
  OPEN_SEGMENT,
  QUALITY_SENSORS,
  RHYTHM_INCREASE_RATIO,
  RHYTHM_NO_EFFECT_RATIO,
  qualitySample,
} from './fixtures';
import type { QualityState, SensorStatus } from './quality';
import {
  BlinkLessonView,
  CleanSignalView,
  EyesClosedView,
  ExploreDisconnected,
  ExploreSurface,
} from './ExploreScreens';
import { ErrorBanner, SnapshotPlot } from './ExploreParts';

/** SIGNAL_QUALITY values are the trace colors, one per sensor. */
const qualityColors = (sensors: SensorStatus[]) =>
  sensors.map((sensor) => sensor.quality);

/** Stand-in for a lesson's live `ViewerComponent`, in stable channel colors. */
const lessonPlot = (
  snapshot: EEGSnapshot,
  annotations?: PlotAnnotation[],
  markerStyle?: 'band' | 'tick'
) => (
  <SnapshotPlot
    snapshot={snapshot}
    annotations={annotations}
    colors={channelColors(snapshot.channels, EXPLORE_CHANNELS)}
    markerStyle={markerStyle}
    width={860}
    height={430}
  />
);

const REVIEW_SEGMENTS = { open: OPEN_SEGMENT, closed: CLOSED_SEGMENT };

const withExploreChrome: Decorator = (Story, { parameters }) => (
  <MemoryRouter>
    <AppShell
      location="home"
      device={(parameters.device ?? 'connected') as DeviceState}
      deviceName="Muse 2"
    >
      <Story />
    </AppShell>
  </MemoryRouter>
);

const meta: Meta = {
  title: 'Domain/Explore',
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        rule1366: {
          name: 'Rule A 1366×768',
          styles: { width: '1366px', height: '768px' },
        },
        rule1280: {
          name: 'Rule A 1280×720',
          styles: { width: '1280px', height: '720px' },
        },
      },
    },
  },
  decorators: [withExploreChrome],
};
export default meta;
type Story = StoryObj;

/** The connected surface in one of the four quality states. */
function Surface({
  state,
  snapshot = LIVE_SNAPSHOT,
  sensors = QUALITY_SENSORS[state === 'waiting' ? 'ready' : state],
  ...props
}: {
  state: QualityState | 'waiting';
  snapshot?: EEGSnapshot;
  sensors?: SensorStatus[];
} & Partial<React.ComponentProps<typeof ExploreSurface>>) {
  const [hoveredChannel, setHoveredChannel] = React.useState<string | null>(
    null
  );
  return (
    <ExploreSurface
      quality={state}
      sensors={sensors}
      channels={sensors.map((sensor) => sensor.channel)}
      sample={state === 'waiting' ? null : qualitySample(sensors)}
      head={state === 'waiting' ? null : of(qualitySample(sensors))}
      livePlot={
        <SnapshotPlot
          snapshot={snapshot}
          colors={qualityColors(sensors)}
          width={760}
          height={330}
        />
      }
      hoveredChannel={hoveredChannel}
      onHoveredChannelChange={setHoveredChannel}
      onStartLesson={fn()}
      {...props}
    />
  );
}

/** X01 — Redesigned landing: what Explore is, one primary action, what waits once connected. */
export const Disconnected: Story = {
  parameters: { device: 'none' },
  render: () => <ExploreDisconnected onConnect={fn()} />,
};

/** X02 — Connected, no data yet: an explicit waiting state; lessons stay disabled until signal arrives. */
export const Waiting: Story = {
  render: () => <Surface state="waiting" />,
};

/** Q01 — Ready: a light status row; the card only earns its weight in the yellow/red states. */
export const QualitySummaryReady: Story = {
  render: () => <Surface state="ready" />,
};

/** Q02 — `Sensors are still settling`: better contact means less static; no fixed warm-up promise. */
export const QualitySummarySettling: Story = {
  render: () => <Surface state="settling" />,
};

/** Q03 — `Adjust AF7 and TP10`: the status names the action and the sensors. */
export const QualitySummaryAdjustSensors: Story = {
  render: () => <Surface state="adjust" />,
};

/** Q04 — `No signal detected`: headset off or disconnected, and the fix. */
export const QualitySummaryNoSignal: Story = {
  render: () => <Surface state="no-signal" snapshot={NO_SIGNAL_SNAPSHOT} />,
};

/** N01 — The plain-language definition of noise (plan §5.1) before the student judges anything. */
export const NoiseDefinition: Story = {
  render: () => (
    <BlinkLessonView
      step={0}
      livePlot={lessonPlot(BLINK_MANY_ALL)}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** L01 — The lessons as clear, local choices; no competing global nav. */
export const LessonPicker: Story = {
  render: () => <Surface state="ready" />,
};

/** C01 — Cleaner-signal tips at 1366×768: the tips beside the live plot (quality colors) and head diagram. */
export const CleanSignalTips: Story = {
  globals: { viewport: { value: 'rule1366', isRotated: false } },
  render: () => (
    <CleanSignalView
      tip={1}
      livePlot={
        <SnapshotPlot
          snapshot={LIVE_SNAPSHOT}
          colors={qualityColors(QUALITY_SENSORS.settling)}
          width={860}
          height={430}
        />
      }
      head={of(qualitySample(QUALITY_SENSORS.settling))}
      channels={EXPLORE_CHANNELS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** C01b — Cleaner-signal tips at 1280×720. */
export const CleanSignalTips720: Story = {
  ...CleanSignalTips,
  globals: { viewport: { value: 'rule1280', isRotated: false } },
};

/** B01 — Blink step 1/4: blink once and find the marked response on the plot. */
export const BlinkStep1: Story = {
  render: () => (
    <BlinkLessonView
      step={1}
      livePlot={lessonPlot(BLINK_ONE, BLINK_ONE_ANNOTATIONS)}
      blinkCount={BLINK_ONE_ANNOTATIONS.length}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** B02 — Blink step 2/4: predict what another blink will do, then check. */
export const BlinkStep2: Story = {
  render: () => (
    <BlinkLessonView
      step={2}
      livePlot={lessonPlot(BLINK_PREDICT, BLINK_PREDICT_ANNOTATIONS)}
      blinkCount={BLINK_PREDICT_ANNOTATIONS.length}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** B02b — The answered state: choosing either option immediately shows the expected answer. */
export const BlinkStep2PredictionAnswered: Story = {
  render: () => (
    <BlinkLessonView
      step={2}
      defaultPrediction="hump"
      livePlot={lessonPlot(BLINK_PREDICT, BLINK_PREDICT_ANNOTATIONS)}
      blinkCount={BLINK_PREDICT_ANNOTATIONS.length}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** B03 — Blink step 3/4: blink several times so the difference is unmistakable. */
export const BlinkStep3: Story = {
  render: () => (
    <BlinkLessonView
      step={3}
      livePlot={lessonPlot(BLINK_MANY, BLINK_MANY_ANNOTATIONS)}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** B04 — Blink step 4/4: a blinking interval beside a quiet one, same sensors, same scale; the range is adjustable. */
export const BlinkStep4: Story = {
  render: () => (
    <BlinkLessonView
      step={4}
      livePlot={lessonPlot(BLINKING_SNAPSHOT)}
      comparison={{
        calm: CALM_SNAPSHOT,
        blinking: BLINKING_SNAPSHOT,
        ratio: COMPARISON_RATIO,
      }}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** B06 — Fallback marker style: a tick at the detection time, for detectors that report an instant instead of an interval. */
export const BlinkTickMarker: Story = {
  render: () => (
    <BlinkLessonView
      step={1}
      livePlot={lessonPlot(BLINK_ONE, BLINK_ONE_ANNOTATIONS, 'tick')}
      blinkCount={BLINK_ONE_ANNOTATIONS.length}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** B05 — BlinkNotDetected: detection misses or the frontal sensors have not settled; the lesson continues gracefully. */
export const BlinkNotDetected: Story = {
  render: () => (
    <BlinkLessonView
      step={2}
      notDetected
      livePlot={lessonPlot(BLINK_PREDICT, BLINK_PREDICT_ANNOTATIONS)}
      blinkCount={BLINK_PREDICT_ANNOTATIONS.length}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** S01 — Noise demonstration on all four sensors: stable trace colors (§5.2), never the quality colors. */
export const NoiseLessonStableColors: Story = {
  render: () => (
    <BlinkLessonView
      step={3}
      livePlot={lessonPlot(BLINK_MANY_ALL, BLINK_MANY_ANNOTATIONS)}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** E01 — Eyes-closed 1/5: what the sounds mean, `Begin eyes-closed activity`, Example reference. */
export const EyesClosedIntro: Story = {
  render: () => (
    <EyesClosedView
      phase="intro"
      showExample
      rhythmRatio={null}
      livePlot={lessonPlot(EYES_CLOSED_LIVE)}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** E02 — Eyes-closed 2/5: visible 3–2–1 countdown (mid-count), pulse respects reduced motion. */
export const EyesClosedCountdown: Story = {
  render: () => (
    <EyesClosedView
      phase="countdown"
      countdown={2}
      rhythmRatio={null}
      livePlot={lessonPlot(EYES_CLOSED_LIVE)}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** E03 — Eyes-closed 3/5: `Close your eyes` and the interval — nothing on screen needs watching. */
export const EyesClosedInterval: Story = {
  render: () => (
    <EyesClosedView
      phase="interval"
      rhythmRatio={null}
      livePlot={lessonPlot(EYES_CLOSED_LIVE)}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** E04 — Eyes-closed 4/5: the unmistakable `Open your eyes` end cue. */
export const EyesClosedEndCue: Story = {
  render: () => (
    <EyesClosedView
      phase="end"
      rhythmRatio={null}
      livePlot={lessonPlot(EYES_CLOSED_LIVE)}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** E05 — Eyes-closed 5/5: two equal segments from the marked interval on one scale, with the measured comparison. */
export const EyesClosedReview: Story = {
  render: () => (
    <EyesClosedView
      phase="review"
      rhythmRatio={RHYTHM_INCREASE_RATIO}
      livePlot={lessonPlot(EYES_CLOSED_LIVE)}
      segments={REVIEW_SEGMENTS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** A01 — AlphaResult: the student's own comparison as the result, with the ideal reference labelled `Example`. */
export const AlphaResult: Story = {
  render: () => (
    <EyesClosedView
      phase="review"
      rhythmRatio={RHYTHM_INCREASE_RATIO}
      showExample
      livePlot={lessonPlot(EYES_CLOSED_LIVE)}
      segments={REVIEW_SEGMENTS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** A02 — AlphaNoEffect: a valid, encouraging outcome — the change is clearest in some people. */
export const AlphaNoEffect: Story = {
  render: () => (
    <EyesClosedView
      phase="review"
      rhythmRatio={RHYTHM_NO_EFFECT_RATIO}
      showExample
      livePlot={lessonPlot(EYES_CLOSED_LIVE)}
      segments={REVIEW_SEGMENTS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** X03 — StreamError: the stream stopped; the message says exactly what to do. */
export const StreamError: Story = {
  render: () => (
    <Surface
      state="adjust"
      banner={
        <ErrorBanner
          title="The signal stream stopped."
          body="The headset is still connected, but its data stream ended. Disconnect and reconnect to start it again."
          actionLabel="Reconnect headset"
          onAction={fn()}
        />
      }
    />
  ),
};

/** X04 — UnsupportedChannels: this headset reports no AF8; the fixture agrees. */
export const UnsupportedChannels: Story = {
  render: () => (
    <Surface
      state="ready"
      sensors={NO_AF8_SENSORS}
      snapshot={NO_AF8_SNAPSHOT}
      banner={
        <ErrorBanner
          title="This headset is not reporting AF8."
          body="Blink detection needs both AF7 and AF8. The blink steps will watch AF7 only — or pick a headset with both forehead sensors. The eyes-closed activity works either way."
          actionLabel="Switch headset"
          onAction={fn()}
        />
      }
    />
  ),
};
