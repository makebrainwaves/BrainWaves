import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import PrimaryNavSegment from './PrimaryNavSegment';
import { Button } from '../ui/button';

const meta: Meta<typeof PrimaryNavSegment> = {
  title: 'Domain/PrimaryNavSegment',
  component: PrimaryNavSegment,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="h-[60px] bg-white flex">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PrimaryNavSegment>;

export const Active: Story = {
  args: { status: 'active', route: '/', title: 'COLLECT', order: 2 },
};

export const Visited: Story = {
  args: { status: 'visited', route: '/', title: 'DESIGN', order: 1 },
};

export const Initial: Story = {
  args: { status: 'initial', route: '/', title: 'ANALYZE', order: 4 },
};

/**
 * The experiment top bar as shipped: raised header with drop shadow, workspace
 * title, 4-step stepper (gold underline runs from the left edge through the
 * active step), one teal-outline action right. Matches the V1 reference.
 */
export const FullHeader: Story = {
  render: () => (
    <div className="relative z-10 h-[60px] w-[1200px] bg-white shadow-[0_5px_16px_0_rgba(0,0,0,0.09)] flex items-center whitespace-nowrap">
      <div className="flex items-center h-full text-lg tracking-[0.5px] border-b-4 border-accent px-6 font-medium text-ink">
        Faces Houses Experiment
      </div>
      <PrimaryNavSegment
        status="active"
        route="/"
        title="EDIT DESIGN"
        order={1}
      />
      <PrimaryNavSegment status="initial" route="/" title="COLLECT" order={2} />
      <PrimaryNavSegment status="initial" route="/" title="CLEAN" order={3} />
      <PrimaryNavSegment status="initial" route="/" title="ANALYZE" order={4} />
      <div className="ml-auto pr-4">
        <Button variant="outline-brand">Save Workspace</Button>
      </div>
    </div>
  ),
};
