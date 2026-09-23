import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { template } from 'lodash';
import {
  endScreen,
  instructionsScreen,
  transitionScreen,
} from '../../experiments/shared/participantScreens';
import {
  CUSTOM,
  CUSTOM_INTRO,
  FACES_HOUSES,
  MULTITASKING,
  STROOP,
  VISUAL_SEARCH,
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

const meta: Meta<typeof LabjsScreen> = {
  title: 'Domain/ParticipantScreens',
  component: LabjsScreen,
  parameters: { layout: 'fullscreen' },
  args: { parameters: { isEEGEnabled: true } },
};
export default meta;
type Story = StoryObj<typeof LabjsScreen>;

/** R01 — Two keys, the protocol's "not a speed test" pacing, EEG stillness line. */
export const InstructionsFacesHouses: Story = {
  args: { content: instructionsScreen(FACES_HOUSES) },
};

/** R02 — Four keys for the ink color; meaning in words, never color alone. */
export const InstructionsStroop: Story = {
  args: { content: instructionsScreen(STROOP) },
};

/** R03 — Present / absent keys and the protocol's "speed counts" pacing. */
export const InstructionsVisualSearch: Story = {
  args: { content: instructionsScreen(VISUAL_SEARCH) },
};

/** R04 — Two rules share the same keys. Space opens the instruction screens; no Q here. */
export const MultitaskingIntro: Story = {
  args: { content: instructionsScreen(MULTITASKING) },
};

/** R05 — Teacher's intro via `parameters.intro`; a condition with no key reads "No key". No pacing line. */
export const InstructionsCustom: Story = {
  args: {
    content: instructionsScreen(CUSTOM),
    parameters: { isEEGEnabled: true, intro: CUSTOM_INTRO },
  },
};

/** R06 — Behavior-only run: same screen without the stillness line. */
export const InstructionsEegOff: Story = {
  args: {
    content: instructionsScreen(FACES_HOUSES),
    parameters: { isEEGEnabled: false },
  },
};

/** R07 — Practice is over; the same mapping again before the recorded task. */
export const Transition: Story = {
  args: {
    content: transitionScreen({
      rules: FACES_HOUSES.rules,
      pacing: FACES_HOUSES.pacing,
    }),
  },
};

/** R08 — Thank-you, Space in the same spot as every other screen. */
export const End: Story = {
  args: { content: endScreen() },
};
