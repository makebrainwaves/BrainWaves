import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SecondaryNavSegment from './SecondaryNavSegment';

const meta: Meta<typeof SecondaryNavSegment> = {
  title: 'Domain/SecondaryNavSegment',
  component: SecondaryNavSegment,
};
export default meta;
type Story = StoryObj<typeof SecondaryNavSegment>;

export const TabRow: Story = {
  render: () => (
    <div className="flex bg-white p-4">
      {['OVERVIEW', 'BACKGROUND', 'EXPERIMENTAL PROTOCOL', 'PREVIEW'].map(
        (title, i) => (
          <SecondaryNavSegment
            key={title}
            title={title}
            active={i === 1}
            onClick={() => {}}
          />
        )
      )}
    </div>
  ),
};
