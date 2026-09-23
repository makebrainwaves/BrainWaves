import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import HomeLanding from './HomeLanding';
import WorkspaceNameDialog from './WorkspaceNameDialog';
import DeleteWorkspaceDialog from './DeleteWorkspaceDialog';
import AppShell from '../AppShell/AppShell';
import { DeviceState } from '../AppShell/types';
import { EXISTING_FACES_HOUSES_NAMES, RECENT_WORKSPACES } from './fixtures';

const meta: Meta<typeof HomeLanding> = {
  title: 'Domain/HomeLanding',
  component: HomeLanding,
  parameters: { layout: 'fullscreen', device: 'connected' },
  // Shown under the real shell bar so first-time vs returning reads in context.
  decorators: [
    (Story, { parameters }) => (
      <AppShell
        location="home"
        device={parameters.device as DeviceState}
        deviceName="Muse 2"
      >
        <Story />
      </AppShell>
    ),
  ],
  args: {
    workspaces: RECENT_WORKSPACES,
    onOpen: fn(),
    onReveal: fn(),
    onDelete: fn(),
    onStartTemplate: fn(),
    onBrowseTemplates: fn(),
    onExploreLive: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof HomeLanding>;

/** H01 — Faces/Houses is the one filled action; Continue is an empty state below. */
export const HomeFirstTime: Story = {
  args: { workspaces: [] },
  parameters: { device: 'none' },
};

/** H02 — Continue leads; opening the most recent workspace is the one filled action. */
export const HomeReturning: Story = {};

const namingDialog = (defaultValue?: string) => (
  <WorkspaceNameDialog
    open
    templateName="Faces/Houses"
    baseName="Faces_Houses"
    existingNames={EXISTING_FACES_HOUSES_NAMES}
    defaultValue={defaultValue}
    onCreate={fn()}
    onCancel={fn()}
  />
);

/** H03 — Opened from a template. The next free name is prefilled. */
export const HomeNamingDialog: Story = {
  render: (args) => (
    <>
      <HomeLanding {...args} />
      {namingDialog()}
    </>
  ),
};

/** H04 — Error in words + red border; one-click fix; Create disabled. */
export const HomeNamingConflict: Story = {
  render: (args) => (
    <>
      <HomeLanding {...args} />
      {namingDialog('Faces_Houses_2')}
    </>
  ),
};

/** H05 — States exactly what will be removed. Destructive action is red. */
export const HomeDeleteConfirm: Story = {
  render: (args) => (
    <>
      <HomeLanding {...args} />
      <DeleteWorkspaceDialog
        open
        workspaceName="Stroop_Task"
        recordingCount={4}
        cleanedCount={3}
        onConfirm={fn()}
        onCancel={fn()}
      />
    </>
  ),
};
