import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import PreviewLabel from './PreviewLabel';
import { Button } from './ui/button';

const meta: Meta<typeof PreviewLabel> = {
  title: 'Domain/PreviewLabel',
  component: PreviewLabel,
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PreviewLabel>;

export const Default: Story = {};

/** How it sits beside the preview toggle, as in PrepareSteps and (at integration) PreviewButtonComponent. */
export const BesideStopPreview: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="lg" variant="outline">
        Stop preview
      </Button>
      <PreviewLabel />
    </div>
  ),
};
