import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardHeader, CardContent } from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <span className="text-lg font-medium text-ink">Card title</span>
      </CardHeader>
      <CardContent>
        <p className="!text-sm text-ink-muted">
          Plain white surface on the app gradient.
        </p>
      </CardContent>
    </Card>
  ),
};

// The experiment-bank card lives in Domain/ExperimentCard (real component + assets).

/** My-Experiments pattern: white row-card — name, meta, right-aligned action cluster. */
export const RowCardList: Story = {
  render: () => (
    <div className="w-[900px] space-y-4">
      {[
        ['Faces_and_Houses', 'a few seconds ago'],
        ['Stroop_Task', '15 days ago'],
        [
          'A_Very_Long_Experiment_Name_That_Should_Not_Break_The_Row_Layout_v2_final',
          '22 days ago',
        ],
      ].map(([name, when]) => (
        <Card key={name} className="flex items-center gap-6 px-6 py-4">
          <span className="flex-1 truncate text-lg text-ink">{name}</span>
          <span className="w-40 shrink-0 text-sm text-ink-muted">{when}</span>
          <span className="flex shrink-0 gap-2">
            <Button variant="secondary">Delete</Button>
            <Button variant="secondary">Go to Folder</Button>
            <Button>Open Experiment</Button>
          </span>
        </Card>
      ))}
    </div>
  ),
};
