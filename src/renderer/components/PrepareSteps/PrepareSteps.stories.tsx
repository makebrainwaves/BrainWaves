import React, { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AppShell from '../AppShell/AppShell';
import PrepareSteps, { PrepareFixture, PrepareStepId } from './PrepareSteps';
import {
  FACES_HOUSES,
  MULTITASKING,
  NOOP_HANDLERS,
  SACKS_STAND_IN,
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
  parameters: { layout: 'fullscreen' },
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
  return (
    <PrepareSteps
      {...fixture}
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

/** P02 — Background. Centered lesson column with Back and Next: Protocol. */
export const Background: Story = {
  render: () => <InteractiveStep initialStep="background" />,
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

/** P10 — OliverSacksFallback. Background's video slot holds the local stand-in (16:9 placeholder) and transcript-length text; no remote player. */
export const OliverSacksFallback: Story = {
  render: () => (
    <PrepareSteps
      {...FACES_HOUSES}
      {...NOOP_HANDLERS}
      step="background"
      mediaFallback={SACKS_STAND_IN}
      isPreviewing={false}
      hasPreviewed={false}
    />
  ),
};
