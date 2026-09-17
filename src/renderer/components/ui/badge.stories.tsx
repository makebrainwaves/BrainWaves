import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="experimental">Experimental</Badge>
      <Badge variant="practice">Practice</Badge>
    </div>
  ),
};
