import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';
import AppShell from '../AppShell/AppShell';
import CustomDesign from './CustomDesignComponent';
import type { DesignProps } from './index';
import { EXPERIMENTS } from '../../constants/constants';
import type { ExperimentParameters } from '../../constants/interfaces';
import { mergeCustomParams } from '../../experiments/custom/params';
import { ExperimentActions } from '../../actions';

/** A Custom design with three named conditions and a hypothesis. */
const PARAMS = mergeCustomParams({
  description: {
    question: 'Do people recognise cats more slowly than dogs?',
    hypothesis:
      'Cats look more alike than dogs, so people will take longer to recognise them.',
    methods: 'Show photos of cats, dogs and birds; press a key for each.',
  },
  stimulus1: { title: 'Cats' },
  stimulus2: { title: 'Dogs' },
  stimulus3: { title: 'Birds' },
});

function Overview({
  params,
  isEEGEnabled = true,
}: {
  params: ExperimentParameters;
  isEEGEnabled?: boolean;
}) {
  const props = {
    navigate: fn(),
    type: EXPERIMENTS.CUSTOM,
    title: 'Cats_vs_Dogs',
    params,
    experimentObject: {},
    ExperimentActions: {
      ...ExperimentActions,
      SetParams: fn(),
      SaveWorkspace: fn(),
      SetEEGEnabled: fn(),
    },
    isEEGEnabled,
  } as unknown as DesignProps;
  return (
    <MemoryRouter>
      <AppShell
        location="prepare"
        workspace={{
          name: 'Cats_vs_Dogs',
          experimentType: 'Custom',
          modality: isEEGEnabled ? 'eeg' : 'behavior',
        }}
        nextArea="collect"
        device="none"
        deviceName="Muse 2"
      >
        <CustomDesign {...props} />
      </AppShell>
    </MemoryRouter>
  );
}

/** Custom's Overview step with the "Make a prediction" card beside the hypothesis. Interactive: pick a pair, a measure and an answer. */
const meta: Meta<typeof Overview> = {
  title: 'Domain/CustomPrediction',
  component: Overview,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof Overview>;

/** C01 — A saved prediction: Cats slower than Dogs, with the hypothesis as the reason. */
export const Picked: Story = {
  args: {
    params: {
      ...PARAMS,
      prediction: {
        conditions: ['Cats', 'Dogs'],
        measure: 'rt',
        direction: 'a>b',
      },
    },
  },
};

/** C02 — Nothing picked yet: the first two conditions, response time. */
export const NotPicked: Story = { args: { params: PARAMS } };

/** C03 — The student renamed Dogs to Puppies after predicting: flagged, nothing shown as picked. */
export const NeedsUpdate: Story = {
  args: {
    params: {
      ...PARAMS,
      stimulus2: { ...PARAMS.stimulus2!, title: 'Puppies' },
      prediction: {
        conditions: ['Cats', 'Dogs'],
        measure: 'erp',
        direction: 'a<b',
      },
    },
  },
};

/** C04 — EEG off: no brain-response measure to choose. */
export const BehaviorOnly: Story = {
  args: { params: PARAMS, isEEGEnabled: false },
};
