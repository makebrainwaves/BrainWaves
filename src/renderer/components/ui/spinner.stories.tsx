import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
};
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4">
      <Spinner size={16} />
      <Spinner />
      <Spinner size={48} />
      <span className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm text-white">
        <Spinner size={16} className="text-white" />
        Analyzing…
      </span>
    </div>
  ),
};
