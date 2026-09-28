import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import PreviewButton from './PreviewButtonComponent';

const meta: Meta<typeof PreviewButton> = {
  title: 'Domain/PreviewButton',
  component: PreviewButton,
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
  args: { isPreviewing: false, onClick: fn(), onRunAndRecord: fn() },
};
export default meta;
type Story = StoryObj<typeof PreviewButton>;

/** Before any preview: Preview experiment is primary; nothing is recorded. */
export const Idle: Story = {};

/** While previewing: Stop preview beside the shared PreviewLabel (used by Custom, Imported and Collect). */
export const Previewing: Story = { args: { isPreviewing: true } };

/** Stateful wrapper so the toggle really starts and stops a preview. */
function InteractivePreviewButton() {
  const [isPreviewing, setIsPreviewing] = useState(false);
  return (
    <PreviewButton
      isPreviewing={isPreviewing}
      onClick={() => setIsPreviewing((previewing) => !previewing)}
      onRunAndRecord={() => {}}
    />
  );
}

/** Clickable: after a preview, Run & record becomes primary and Preview again secondary. */
export const Interactive: Story = {
  render: () => <InteractivePreviewButton />,
};
