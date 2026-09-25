import React from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';
import AppShell from '../AppShell/AppShell';
import type { DeviceState } from '../AppShell/types';
import {
  ALPHA_INCREASE_RATIO,
  ALPHA_NO_EFFECT_RATIO,
  BLINK_MANY,
  BLINK_MANY_ALL,
  BLINK_MANY_ANNOTATIONS,
  BLINK_ONE,
  BLINK_ONE_ANNOTATIONS,
  BLINK_PREDICT,
  BLINK_PREDICT_ANNOTATIONS,
  BLINKING_SNAPSHOT,
  CALM_SNAPSHOT,
  COMPARISON_RATIO,
  COMPARISON_SHARED_SCALE,
  EYES_CLOSED_ANNOTATIONS,
  EYES_CLOSED_LIVE,
  EYES_CLOSED_SNAPSHOT,
  LIVE_SNAPSHOT,
  NO_SIGNAL_SNAPSHOT,
  QUALITY_SCENARIOS,
  QualityState,
  SensorStatus,
} from './fixtures';
import {
  BlinkLessonView,
  EyesClosedView,
  ExploreDisconnected,
  ExploreSurface,
} from './ExploreScreens';
import { ErrorBanner } from './ExploreParts';

/** SIGNAL_QUALITY values are the trace colors, one per sensor. */
const qualityColors = (sensors: SensorStatus[]) =>
  sensors.map((sensor) => sensor.quality);

/**
 * Explore in the real AppShell with no workspace (Explore is workspace-free;
 * the shell bar is the only chrome). All signal traces are synthetic fixture
 * series — labelled "example" in these descriptions only, exactly as the app
 * copy will read once the real webview is wired in.
 */
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
  parameters: { layout: 'fullscreen' },
  decorators: [withExploreChrome],
};
export default meta;
type Story = StoryObj;

/** The connected surface in one of the four quality states. */
function Surface({
  state,
  ...props
}: {
  state: QualityState | 'waiting';
} & Partial<React.ComponentProps<typeof ExploreSurface>>) {
  const sensors =
    QUALITY_SCENARIOS[state === 'waiting' ? 'ready' : state].sensors;
  return (
    <ExploreSurface
      quality={state}
      sensors={sensors}
      snapshot={LIVE_SNAPSHOT}
      colors={qualityColors(sensors)}
      onStartLesson={fn()}
      {...props}
    />
  );
}

/** X01 — Redesigned landing: what Explore is, one primary action, what waits once connected. Nothing is recorded. */
export const Disconnected: Story = {
  parameters: { device: 'none' },
  render: () => <ExploreDisconnected onConnect={fn()} />,
};

/** X02 — Connected, no data yet: an explicit waiting state; lessons stay disabled until signal arrives. */
export const Waiting: Story = {
  render: () => <Surface state="waiting" snapshot={null} />,
};

/** Q01 — Overall status above the plot: `Ready to explore`, per-sensor words at left. */
export const QualitySummaryReady: Story = {
  render: () => <Surface state="ready" />,
};

/** Q02 — `Sensors are still settling`: contact can improve over several minutes, never a fixed warm-up. */
export const QualitySummarySettling: Story = {
  render: () => <Surface state="settling" />,
};

/** Q03 — `Adjust AF7 and TP10`: the status names the action and the sensors. */
export const QualitySummaryAdjustSensors: Story = {
  render: () => <Surface state="adjust" />,
};

/** Q04 — `No signal detected`: flat traces, and what to check. */
export const QualitySummaryNoSignal: Story = {
  render: () => <Surface state="no-signal" snapshot={NO_SIGNAL_SNAPSHOT} />,
};

/** N01 — The plain-language definition of noise (plan §5.1) before the student judges anything. */
export const NoiseDefinition: Story = {
  render: () => (
    <BlinkLessonView
      step={0}
      showLegend
      snapshot={BLINK_MANY_ALL}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** L01 — The two lessons as clear, local choices; no competing global nav. */
export const LessonPicker: Story = {
  render: () => <Surface state="ready" />,
};

/** B01 — Blink step 1/4: blink once and find the marked response on the plot. */
export const BlinkStep1: Story = {
  render: () => (
    <BlinkLessonView
      step={1}
      snapshot={BLINK_ONE}
      annotations={BLINK_ONE_ANNOTATIONS}
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
      snapshot={BLINK_PREDICT}
      annotations={BLINK_PREDICT_ANNOTATIONS}
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
      snapshot={BLINK_MANY}
      annotations={BLINK_MANY_ANNOTATIONS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** B04 — Blink step 4/4: a blinking interval beside a quiet one, same sensors, same scale. */
export const BlinkStep4: Story = {
  render: () => (
    <BlinkLessonView
      step={4}
      snapshot={BLINKING_SNAPSHOT}
      comparison={{
        calm: CALM_SNAPSHOT,
        blinking: BLINKING_SNAPSHOT,
        sharedScale: COMPARISON_SHARED_SCALE,
        ratio: COMPARISON_RATIO,
      }}
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
      snapshot={BLINK_PREDICT}
      annotations={BLINK_PREDICT_ANNOTATIONS}
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
      showLegend
      snapshot={BLINK_MANY_ALL}
      annotations={BLINK_MANY_ANNOTATIONS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** E01 — Eyes-closed 1/5: the start and end sounds explained, `Begin eyes-closed activity`, Example reference. */
export const EyesClosedIntro: Story = {
  render: () => (
    <EyesClosedView
      phase="intro"
      showExample
      alphaRatio={null}
      snapshot={EYES_CLOSED_LIVE}
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
      alphaRatio={null}
      snapshot={EYES_CLOSED_LIVE}
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
      alphaRatio={null}
      snapshot={EYES_CLOSED_LIVE}
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
      alphaRatio={null}
      snapshot={EYES_CLOSED_LIVE}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** E05 — Eyes-closed 5/5: the marked interval reviewed with the measured 8–12 Hz comparison. */
export const EyesClosedReview: Story = {
  render: () => (
    <EyesClosedView
      phase="review"
      alphaRatio={ALPHA_INCREASE_RATIO}
      snapshot={EYES_CLOSED_SNAPSHOT}
      annotations={EYES_CLOSED_ANNOTATIONS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** A01 — AlphaResult: the student's real comparison as the result, with the ideal reference labelled `Example`. */
export const AlphaResult: Story = {
  render: () => (
    <EyesClosedView
      phase="review"
      alphaRatio={ALPHA_INCREASE_RATIO}
      showExample
      snapshot={EYES_CLOSED_SNAPSHOT}
      annotations={EYES_CLOSED_ANNOTATIONS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** A02 — AlphaNoEffect: a valid, encouraging outcome — alpha is subtle for many people. */
export const AlphaNoEffect: Story = {
  render: () => (
    <EyesClosedView
      phase="review"
      alphaRatio={ALPHA_NO_EFFECT_RATIO}
      showExample
      snapshot={EYES_CLOSED_SNAPSHOT}
      annotations={EYES_CLOSED_ANNOTATIONS}
      onBack={fn()}
      onNext={fn()}
      onExit={fn()}
    />
  ),
};

/** X03 — Stream error and unsupported channels: both say exactly what to do. */
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
          unsupported="Blink detection needs both AF7 and AF8, and this headset is not reporting AF8. The blink steps will watch AF7 only — or pick a headset with both forehead sensors. The eyes-closed activity works either way."
        />
      }
    />
  ),
};