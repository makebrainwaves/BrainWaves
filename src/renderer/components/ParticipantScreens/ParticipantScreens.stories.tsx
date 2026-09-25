import React from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { template } from 'lodash';
import AppShell from '../AppShell/AppShell';
import {
  endScreen,
  instructionsScreen,
  transitionScreen,
} from '../../experiments/shared/participantScreens';
import { instructions as FACES_HOUSES } from '../../experiments/faces_houses/screens';
import { instructions as STROOP } from '../../experiments/stroop/screens';
import { instructions as VISUAL_SEARCH } from '../../experiments/search/screens';
import { instructions as MULTITASKING } from '../../experiments/multitasking/screens';
import {
  CUSTOM,
  CUSTOM_FOUR_KEYS,
  CUSTOM_INTRO,
  CUSTOM_LONG_INTRO,
} from './fixtures';

interface LabjsScreenProps {
  /** A lab.js `content` string, as the builders return it. */
  content: string;
  /** The component's `this.parameters` at prepare time. */
  parameters: Record<string, unknown>;
}

/**
 * Renders a content string the way lab.js does: lodash `template` with the
 * parameter context as `this`, injected into the real lab.js mount
 * (`LabjsExperimentWindow`).
 */
function LabjsScreen({ content, parameters }: LabjsScreenProps) {
  const ctx = { parameters, state: {}, files: {} };
  const html = template(content, { escape: '', evaluate: '' }).call(ctx, ctx);
  return (
    <div
      className="container fullscreen"
      data-labjs-section="main"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * The chrome a participant actually sees around the lab.js mount: AppShell's
 * RunBar, then RunComponent's padded area and its two `h-full` wrappers.
 * RunComponent's outer div is `h-screen` today; this uses `h-full`, the
 * engineering fix that lets the area fit under the 64px RunBar.
 * `parameters.experimentType` names the workspace.
 */
const withRunChrome: Decorator<LabjsScreenProps> = (
  Story,
  { args, parameters }
) => {
  const eeg = Boolean(args.parameters?.isEEGEnabled);
  const experimentType: string = parameters.experimentType ?? 'Faces/Houses';
  return (
    <AppShell
      location="collect"
      workspace={{
        name: `${experimentType.replace(/\W+/g, '_')}_1`,
        experimentType,
        modality: eeg ? 'eeg' : 'behavior',
      }}
      device={eeg ? 'connected' : 'none'}
      run={{ kind: eeg ? 'eeg' : 'behavior', elapsed: '00:12' }}
    >
      <div className="h-full p-[3%] bg-app" data-tid="container">
        <div className="h-full">
          <div className="h-full w-full">
            <Story />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const meta: Meta<typeof LabjsScreen> = {
  title: 'Domain/ParticipantScreens',
  component: LabjsScreen,
  parameters: { layout: 'fullscreen' },
  decorators: [withRunChrome],
  args: { parameters: { isEEGEnabled: true } },
};
export default meta;
type Story = StoryObj<typeof LabjsScreen>;

/** R01 — Chalk "Practice first" tag at the top, two keys, the protocol's "not a speed test" pacing, stillness line. */
export const InstructionsFacesHouses: Story = {
  args: { content: instructionsScreen(FACES_HOUSES) },
};

/** R02 — Ink-vs-word examples, each color named in words, then four keys for the ink color. */
export const InstructionsStroop: Story = {
  parameters: { experimentType: 'Stroop' },
  args: { content: instructionsScreen(STROOP) },
};

/** R03 — The target and both distractors drawn as the task draws them, labelled Find / Ignore. */
export const InstructionsVisualSearch: Story = {
  parameters: { experimentType: 'Visual Search' },
  args: { content: instructionsScreen(VISUAL_SEARCH) },
};

/** R04 — Two rules share the same keys. Space opens the instruction screens; no Q here. */
export const MultitaskingIntro: Story = {
  parameters: { experimentType: 'Multitasking' },
  args: { content: instructionsScreen(MULTITASKING) },
};

/** R05 — Teacher's intro via `parameters.intro`; a condition with no key reads "No key". No pacing line. */
export const InstructionsCustom: Story = {
  parameters: { experimentType: 'Custom' },
  args: {
    content: instructionsScreen(CUSTOM),
    parameters: { isEEGEnabled: true, intro: CUSTOM_INTRO },
  },
};

/** R05b — Stress: a textarea-full teacher intro and four keys. `main` scrolls; Space stays put. */
export const InstructionsCustomLongIntro: Story = {
  parameters: { experimentType: 'Custom' },
  args: {
    content: instructionsScreen(CUSTOM_FOUR_KEYS),
    parameters: { isEEGEnabled: true, intro: CUSTOM_LONG_INTRO },
  },
};

/** R06 — Behavior-only run: same screen without the stillness line; RunBar shows "Behavior only". */
export const InstructionsEegOff: Story = {
  args: {
    content: instructionsScreen(FACES_HOUSES),
    parameters: { isEEGEnabled: false },
  },
};

/** R07 — "Data collection" tag at the top with the RunBar's red dot; the same mapping again. */
export const Transition: Story = {
  args: {
    content: transitionScreen(FACES_HOUSES),
  },
};

/** R08 — Thank-you, Space in the same spot as every other screen. */
export const End: Story = {
  args: { content: endScreen() },
};
