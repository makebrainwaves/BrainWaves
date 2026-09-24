import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AppShell from '../AppShell/AppShell';
import PrepareSteps, { PrepareStepId } from './PrepareSteps';
import {
  CUSTOM,
  FACES_HOUSES,
  IMPORTED,
  NOOP_HANDLERS,
  SEARCH,
  STROOP,
} from './fixtures';

interface StoryParams {
  step?: PrepareStepId;
  isPreviewing?: boolean;
  hasPreviewed?: boolean;
  modality?: 'eeg' | 'behavior';
  fixture?: 'faces' | 'stroop' | 'search' | 'custom' | 'imported';
}

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

const customWorkspace = {
  name: 'My_Custom_Exp',
  experimentType: 'Custom',
  modality: 'eeg' as const,
};

const importedWorkspace = {
  name: 'Imported_Study',
  experimentType: 'Imported',
  modality: 'eeg' as const,
};

function fixtureFor(key: StoryParams['fixture']) {
  switch (key) {
    case 'stroop':
      return STROOP;
    case 'search':
      return SEARCH;
    case 'custom':
      return CUSTOM;
    case 'imported':
      return IMPORTED;
    case 'faces':
    default:
      return FACES_HOUSES;
  }
}

/**
 * Wrap the story in the real AppShell chrome at Prepare, with Collect
 * recommended. This makes the local stepper visually subordinate to the
 * global gold-underline workflow bar.
 */
const withPrepareChrome = (Story: any, { parameters }: any) => {
  const ws = parameters.workspace ?? workspace;
  return (
    <AppShell
      location="prepare"
      workspace={ws}
      nextArea="collect"
      device={parameters.device ?? 'connected'}
      deviceName="Muse 2"
    >
      <Story />
    </AppShell>
  );
};

const meta: Meta<typeof PrepareSteps> = {
  title: 'Domain/PrepareSteps',
  component: PrepareSteps,
  parameters: { layout: 'fullscreen' },
  decorators: [withPrepareChrome],
  args: {
    heading: FACES_HOUSES.heading,
    overview: FACES_HOUSES.overview,
    background: FACES_HOUSES.background,
    protocol: FACES_HOUSES.protocol,
    expectedKeys: FACES_HOUSES.expectedKeys,
    flow: FACES_HOUSES.flow,
    icon: FACES_HOUSES.icon,
    modality: 'eeg',
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

/** Local stepper is a rounded pill sequence, visually distinct from the global gold-underline workflow bar. */
function InteractiveStep({
  initialStep,
  fixtureKey = 'faces',
  modality = 'eeg',
}: {
  initialStep: PrepareStepId;
  fixtureKey?: StoryParams['fixture'];
  modality?: 'eeg' | 'behavior';
}) {
  const fixture = fixtureFor(fixtureKey);
  const [step, setStep] = useState<PrepareStepId>(initialStep);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  return (
    <PrepareSteps
      step={step}
      heading={fixture.heading}
      overview={fixture.overview}
      background={fixture.background}
      protocol={fixture.protocol}
      expectedKeys={fixture.expectedKeys}
      flow={fixture.flow}
      icon={fixture.icon}
      modality={modality}
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

/** P01 — Overview. One dominant forward action to Background. */
export const Overview: Story = {
  render: () => <InteractiveStep initialStep="overview" />,
};

/** P02 — Background. Readable lesson copy with Back and Next: Protocol. */
export const Background: Story = {
  render: () => <InteractiveStep initialStep="background" />,
};

/** P03 — Protocol. Condition cards, keycaps, and a compact flow infographic. */
export const Protocol: Story = {
  render: () => <InteractiveStep initialStep="protocol" />,
};

/** P04 — PreviewStopped. Nothing recorded; Try the experiment primary, Run & record reachable. */
export const PreviewStopped: Story = {
  render: () => <InteractiveStep initialStep="preview" />,
};

/** P05 — PreviewRunning. PREVIEW chrome, expected keys, Stop preview. */
export const PreviewRunning: Story = {
  render: () => (
    <PrepareSteps
      step="preview"
      heading={FACES_HOUSES.heading}
      overview={FACES_HOUSES.overview}
      background={FACES_HOUSES.background}
      protocol={FACES_HOUSES.protocol}
      expectedKeys={FACES_HOUSES.expectedKeys}
      flow={FACES_HOUSES.flow}
      icon={FACES_HOUSES.icon}
      modality="eeg"
      isPreviewing
      hasPreviewed
      {...NOOP_HANDLERS}
    />
  ),
};

/** P06 — PreviewFinished. Run & record is primary; Preview again secondary. */
export const PreviewFinished: Story = {
  render: () => (
    <PrepareSteps
      step="preview"
      heading={FACES_HOUSES.heading}
      overview={FACES_HOUSES.overview}
      background={FACES_HOUSES.background}
      protocol={FACES_HOUSES.protocol}
      expectedKeys={FACES_HOUSES.expectedKeys}
      flow={FACES_HOUSES.flow}
      icon={FACES_HOUSES.icon}
      modality="eeg"
      isPreviewing={false}
      hasPreviewed={true}
      {...NOOP_HANDLERS}
    />
  ),
};

/**
 * P07 — DirectCollect. A student who skips the lessons: on Overview of a
 * behavior-only workspace, Collect is marked Next and clickable in the global
 * bar. Nothing is locked or checked off.
 */
export const DirectCollect: Story = {
  parameters: { workspace: behaviorWorkspace, device: 'none' },
  render: () => (
    <InteractiveStep initialStep="overview" fixtureKey="stroop" modality="behavior" />
  ),
};

/** P08 — CustomDesign. Same local-step treatment, with Design heading and form placeholders. */
export const CustomDesign: Story = {
  parameters: { workspace: customWorkspace },
  render: () => <InteractiveStep initialStep="overview" fixtureKey="custom" />,
};

/** P09 — ImportedConfigure. Same local-step treatment, with Configure heading and form placeholders. */
export const ImportedConfigure: Story = {
  parameters: { workspace: importedWorkspace },
  render: () => (
    <InteractiveStep initialStep="overview" fixtureKey="imported" />
  ),
};

/** P10 — OliverSacksFallback. Background with the Sacks section: illustration placeholder + explanatory text, no remote player. */
export const OliverSacksFallback: Story = {
  render: () => (
    <PrepareSteps
      step="background"
      heading={FACES_HOUSES.heading}
      overview={FACES_HOUSES.overview}
      background={{ ...FACES_HOUSES.background, links: [] }}
      protocol={FACES_HOUSES.protocol}
      expectedKeys={FACES_HOUSES.expectedKeys}
      flow={FACES_HOUSES.flow}
      icon={FACES_HOUSES.icon}
      mediaFallback={FACES_HOUSES.mediaFallback}
      modality="eeg"
      isPreviewing={false}
      hasPreviewed={false}
      {...NOOP_HANDLERS}
    />
  ),
};

/** P11 — Stroop protocol shows the flow infographic adapts (no practice trials). */
export const ProtocolStroop: Story = {
  render: () => <InteractiveStep initialStep="protocol" fixtureKey="stroop" />,
};

/** P12 — Visual Search protocol shows the flow and pacing wording differences. */
export const ProtocolSearch: Story = {
  render: () => <InteractiveStep initialStep="protocol" fixtureKey="search" />,
};
