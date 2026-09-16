import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import InputModal from './InputModal';

const meta: Meta<typeof InputModal> = {
  title: 'Domain/InputModal',
  component: InputModal,
  // The dialog portals to document.body; this backdrop keeps real content in
  // the story root (capture tooling needs it) and shows the modal in context.
  decorators: [
    (Story) => (
      <div className="h-screen w-full bg-app">
        <Story />
      </div>
    ),
  ],
  args: {
    open: true,
    header: 'Name your new experiment',
    onClose: () => {},
    onExit: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof InputModal>;

export const Open: Story = {};

/** Submitting with no text shows the red error border. */
export const ErrorState: Story = {
  play: async () => {
    // Dialog renders in a portal outside the story root — query the whole body.
    const body = within(document.body);
    await userEvent.click(await body.findByRole('button', { name: 'OK' }));
    const input = document.body.querySelector('input');
    await expect(input).toHaveClass('border-red-500');
  },
};
