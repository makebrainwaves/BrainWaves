import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import RunResult from './RunResult';

const meta: Meta<typeof RunResult> = {
  title: 'Domain/Collect/RunResult',
  component: RunResult,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="h-screen bg-app p-[3%]">
        <Story />
      </div>
    ),
  ],
  args: {
    subject: 'P01',
    modality: 'eeg',
    onClean: fn(),
    onAnalyze: fn(),
    onRunAnother: fn(),
    onRunAgain: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof RunResult>;

/** C01 — Clean is the one filled action; another participant stays one click away. */
export const CompleteEEG: Story = { args: { outcome: 'complete' } };

/** C02 — No EEG to clean, so Analyze is recommended instead. */
export const CompleteBehaviorOnly: Story = {
  args: { outcome: 'complete', modality: 'behavior' },
};

/** C03 — Never "Recording complete". Data is kept but incomplete; one action, no Resume. */
export const EndedEarly: Story = { args: { outcome: 'incomplete' } };

/** C04 — Between an early exit and its result while the recording is closed and saved. */
export const Finalizing: Story = { args: { outcome: 'saving' } };
