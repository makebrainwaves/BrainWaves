import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExperimentCard } from './ExperimentCard';
import faceHouseIcon from '../../experiments/faces_houses/icon.png';
import stroopIcon from '../../experiments/stroop/icon.png';

const meta: Meta<typeof ExperimentCard> = {
  title: 'Domain/ExperimentCard',
  component: ExperimentCard,
};
export default meta;
type Story = StoryObj<typeof ExperimentCard>;

export const FacesHouses: Story = {
  args: {
    icon: faceHouseIcon,
    title: 'Faces/Houses',
    description:
      'Explore how people react to different kinds of images, like faces vs. houses.',
    onClick: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
};

/** The experiment-bank grid: two columns, flat gold illustrations. */
export const BankGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-5 w-[1000px]">
      <ExperimentCard
        icon={faceHouseIcon}
        title="Faces/Houses"
        description="Explore how people react to different kinds of images, like faces vs. houses."
        onClick={() => {}}
      />
      <ExperimentCard
        icon={stroopIcon}
        title="Stroop"
        description='Investigate why it is hard to deal with contradictory information (like the word "RED" printed in blue).'
        onClick={() => {}}
      />
    </div>
  ),
};
