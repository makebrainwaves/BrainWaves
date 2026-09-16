import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';
import { Spinner } from './spinner';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Open Experiment' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <Button>Default</Button>
      <Button variant="outline-brand">Outline Brand</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">?</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4">
      <Button disabled>Run &amp; Record Experiment</Button>
      <Button variant="secondary" disabled>
        Go to Folder
      </Button>
      <Button variant="destructive" disabled>
        Delete
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <Button disabled className="gap-2">
      <Spinner size={16} className="text-white" />
      Loading Pyodide…
    </Button>
  ),
};

/** DESIGN.md rule: one filled-teal primary per surface; the rest stay neutral. */
export const OnePrimaryPerSurface: Story = {
  render: () => (
    <div className="flex items-center justify-end gap-3 p-4 bg-white rounded-lg w-[560px]">
      <Button variant="secondary">Delete</Button>
      <Button variant="secondary">Go to Folder</Button>
      <Button>Open Experiment</Button>
    </div>
  ),
};
