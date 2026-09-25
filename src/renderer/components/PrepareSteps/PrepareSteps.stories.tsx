import React, { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import {
  instructionsScreen,
  STILLNESS_LINE,
} from '../../experiments/shared/participantScreens';
import { instructions as facesScreen } from '../../experiments/faces_houses/screens';
import { instructions as stroopScreen } from '../../experiments/stroop/screens';
import { instructions as searchScreen } from '../../experiments/search/screens';
import { instructions as multitaskingScreen } from '../../experiments/multitasking/screens';
import AppShell from '../AppShell/AppShell';
import PrepareSteps, { PrepareFixture, PrepareStepId } from './PrepareSteps';
import {
  FACES_HOUSES,
  MULTITASKING,
  NOOP_HANDLERS,
  SEARCH,
  STROOP,
} from './fixtures';

const workspace = {
  name: 'Faces_Houses_4',
  experimentType: 'Faces/Houses',
  modality: 'eeg' as const,
};

const behaviorWorkspace = {
  name: 'Stroop_Task_2',
  experimentType: 'Stroop',
  modality: 'behavior' as const,
};

const stroopWorkspace = { ...behaviorWorkspace, modality: 'eeg' as const };

const searchWorkspace = {
  name: 'Visual_Search_1',
  experimentType: 'Visual Search',
  modality: 'eeg' as const,
};

const multitaskingWorkspace = {
  name: 'Multitasking_1',
  experimentType: 'Multitasking',
  modality: 'eeg' as const,
};

/**
 * Wrap the story in the real AppShell chrome at Prepare, with Collect
 * recommended. This makes the local stepper visually subordinate to the
 * global gold-underline workflow bar.
 */
const withPrepareChrome: Decorator = (Story, { parameters }) => (
  <AppShell
    location="prepare"
    workspace={parameters.workspace ?? workspace}
    nextArea="collect"
    device={parameters.device ?? 'connected'}
    deviceName="Muse 2"
  >
    <Story />
  </AppShell>
);

const meta: Meta<typeof PrepareSteps> = {
  title: 'Domain/PrepareSteps',
  component: PrepareSteps,
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
  decorators: [withPrepareChrome],
  args: {
    ...FACES_HOUSES,
    isPreviewing: false,
    hasPreviewed: false,
    onStep: fn(),
    onCollect: fn(),
    onPreviewStart: fn(),
    onPreviewStop: fn(),
    onPreviewAgain: fn(),
    isEEGEnabled: true,
    onEEGEnabledChange: fn(),
    onCustomize: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof PrepareSteps>;

/** Clickable stepper and preview state, so a reviewer can walk the whole lesson from any story. */
function InteractiveStep({
  initialStep,
  fixture = FACES_HOUSES,
}: {
  initialStep: PrepareStepId;
  fixture?: PrepareFixture;
}) {
  const [step, setStep] = useState<PrepareStepId>(initialStep);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [isEEGEnabled, setIsEEGEnabled] = useState(true);
  return (
    <PrepareSteps
      {...fixture}
      isEEGEnabled={isEEGEnabled}
      onEEGEnabledChange={setIsEEGEnabled}
      onCustomize={() => {}}
      step={step}
      isPreviewing={isPreviewing}
      hasPreviewed={hasPreviewed}
      onStep={setStep}
      onCollect={() => {}}
      onPreviewStart={() => {
        setIsPreviewing(true);
        setHasPreviewed(true);
      }}
      onPreviewStop={() => setIsPreviewing(false)}
      onPreviewAgain={() => setIsPreviewing(true)}
    />
  );
}

/** P01 — Overview. Gold current-step pill in the secondary bar; one forward action to Background. */
export const Overview: Story = {
  render: () => <InteractiveStep initialStep="overview" />,
};

/** P02 — Background. Centered lesson column with Back and Next: Protocol; Stroop's video link (Faces/Houses uses the Sacks stand-in, P10). */
export const Background: Story = {
  parameters: { workspace: stroopWorkspace },
  render: () => <InteractiveStep initialStep="background" fixture={STROOP} />,
};

/** P03 — Protocol. Static stimulus → key diagram beside a vertical task timeline generated from `flow`. */
export const Protocol: Story = {
  render: () => <InteractiveStep initialStep="protocol" />,
};

/** P04 — Stroop protocol: four ink colors, four keys; 8 practice + 96 recorded trials. */
export const ProtocolStroop: Story = {
  parameters: { workspace: stroopWorkspace },
  render: () => <InteractiveStep initialStep="protocol" fixture={STROOP} />,
};

/** P05 — Visual Search protocol: target present / absent on b / n. */
export const ProtocolSearch: Story = {
  parameters: { workspace: searchWorkspace },
  render: () => <InteractiveStep initialStep="protocol" fixture={SEARCH} />,
};

/** P05b — Multitasking protocol: two rules on the same b / n keys; a block timeline with no study-wide total. */
export const ProtocolMultitasking: Story = {
  parameters: { workspace: multitaskingWorkspace },
  render: () => (
    <InteractiveStep initialStep="protocol" fixture={MULTITASKING} />
  ),
};

/** P06 — PreviewStopped. Nothing recorded; Try the experiment is primary. */
export const PreviewStopped: Story = {
  render: () => <InteractiveStep initialStep="preview" />,
};

/** P07 — PreviewRunning. Shared PreviewLabel beside Stop preview; expected keys under the experiment area. */
export const PreviewRunning: Story = {
  render: () => (
    <PrepareSteps
      {...FACES_HOUSES}
      {...NOOP_HANDLERS}
      step="preview"
      isPreviewing
      hasPreviewed
    />
  ),
};

/** Each built-in's first participant screen with its Prepare data; EEG on, so the stillness line makes it the tallest variant. */
const FIRST_SCREENS = {
  faces: { fixture: FACES_HOUSES, screen: facesScreen },
  stroop: { fixture: STROOP, screen: stroopScreen },
  search: { fixture: SEARCH, screen: searchScreen },
  multitasking: { fixture: MULTITASKING, screen: multitaskingScreen },
};

/**
 * The markup `PreviewExperimentComponent` → `LabjsExperimentWindow` mounts,
 * with the first screen's content as lab.js renders it into the section.
 */
function ParticipantMount({ html }: { html: string }) {
  return (
    <div className="flex h-full w-full">
      <div
        className="container"
        data-labjs-section="main"
        dangerouslySetInnerHTML={{
          __html: html.replace(
            /\$\{this\.parameters\.isEEGEnabled[^}]*\}/,
            `<li>${STILLNESS_LINE}</li>`
          ),
        }}
      />
    </div>
  );
}

type FullPreviewStory = StoryObj<{ experiment: keyof typeof FIRST_SCREENS }>;

/** P07b — PreviewRunningFull at 1366×768: a real first participant screen, keys and Space line visible with no scrolling. */
export const PreviewRunningFull: FullPreviewStory = {
  args: { experiment: 'faces' },
  argTypes: {
    experiment: { control: 'select', options: Object.keys(FIRST_SCREENS) },
  },
  globals: { viewport: { value: 'rule1366', isRotated: false } },
  render: ({ experiment }) => (
    <PrepareSteps
      {...FIRST_SCREENS[experiment].fixture}
      {...NOOP_HANDLERS}
      step="preview"
      isPreviewing
      hasPreviewed
      preview={
        <ParticipantMount
          html={instructionsScreen(FIRST_SCREENS[experiment].screen)}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const participant = canvasElement.querySelector('.bw-participant main');
    const page = canvasElement.querySelector('.experiment-design-content');
    const footer = canvasElement.querySelector('.bw-participant footer');
    await expect(participant?.scrollHeight).toBeLessThanOrEqual(
      (participant?.clientHeight ?? 0) + 1
    );
    await expect(page?.scrollHeight).toBeLessThanOrEqual(
      (page?.clientHeight ?? 0) + 1
    );
    await expect(footer?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      window.innerHeight
    );
  },
};

/** P07c — PreviewRunningFull at 1280×720. */
export const PreviewRunningFull720: FullPreviewStory = {
  ...PreviewRunningFull,
  globals: { viewport: { value: 'rule1280', isRotated: false } },
};
/** P08 — PreviewFinished. Run & record is primary; Preview again secondary. */
export const PreviewFinished: Story = {
  render: () => (
    <PrepareSteps
      {...FACES_HOUSES}
      {...NOOP_HANDLERS}
      step="preview"
      isPreviewing={false}
      hasPreviewed
    />
  ),
};

/**
 * P09 — DirectCollect. A student who skips the lessons: on Overview of a
 * behavior-only workspace, Collect is marked Next and clickable in the global
 * bar. Nothing is locked or checked off.
 */
export const DirectCollect: Story = {
  parameters: { workspace: behaviorWorkspace, device: 'none' },
  render: () => <InteractiveStep initialStep="overview" fixture={STROOP} />,
};

/** P11 — EEGOff. The action row's EEG recording switch off (behavior-only workspace); Customize beside it. */
export const EEGOff: Story = {
  parameters: { workspace: behaviorWorkspace },
  render: () => (
    <PrepareSteps
      {...STROOP}
      {...NOOP_HANDLERS}
      step="overview"
      isEEGEnabled={false}
      isPreviewing={false}
      hasPreviewed={false}
    />
  ),
};

/** P10 — OliverSacksFallback. Background's Sacks stand-in: a local face-crowd illustration (one familiar face blank, with a "?") and transcript-length text; no remote player. */
export const OliverSacksFallback: Story = {
  render: () => (
    <PrepareSteps
      {...FACES_HOUSES}
      {...NOOP_HANDLERS}
      step="background"
      isPreviewing={false}
      hasPreviewed={false}
    />
  ),
};
