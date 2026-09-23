import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import HeadsetSetup from './HeadsetSetup';
import SignalPrepPanel from './SignalPrep';
import { DEVICES } from '../../constants/constants';
import { CROWN_SENSORS, FOUND_MUSE, MIXED_MUSE_SENSORS } from './fixtures';

const meta: Meta<typeof HeadsetSetup> = {
  title: 'Domain/HeadsetSetup',
  component: HeadsetSetup,
  parameters: { layout: 'fullscreen', surface: 'modal' },
  // `modal`: dimmed stand-in for the Collect/Explore screen behind pairing.
  // `page`: signal prep sits on the screen itself.
  decorators: [
    (Story, { parameters }) =>
      parameters.surface === 'page' ? (
        <div className="min-h-screen bg-app px-[56px] py-[40px]">
          <Story />
        </div>
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]/40 p-[40px]">
          <Story />
        </div>
      ),
  ],
  args: {
    device: DEVICES.MUSE,
    onChooseDevice: fn(),
    onBack: fn(),
    onContinue: fn(),
    onFindHeadset: fn(),
    onCancel: fn(),
    onSelectHeadset: fn(),
    onConnect: fn(),
    onStartSoftwareSource: fn(),
    onDone: fn(),
    onClose: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof HeadsetSetup>;

/** P01 — Two equal headset cards; fixture and LSL are quiet links, never the default. */
export const ChooseDeviceType: Story = {
  args: { step: 'choose', device: undefined, showFixture: true, showLSL: true },
};

/** P02 — Muse worn illustration with wearing cues, then power-on and "lights moving = waiting to pair". */
export const HowToWearMuse: Story = { args: { step: 'wear' } };

/** P03 — Same shape for the Crown: its own art, cues and power-on copy. */
export const HowToWearCrown: Story = {
  args: { step: 'wear', device: DEVICES.NEUROSITY },
};

/** P04 — Discovery starts only from the one filled `Find my headset` button. No auto-scan. */
export const ReadyToSearch: Story = { args: { step: 'ready' } };

/** P05 — Open-ended search with a live status; Cancel is always available. No countdown. */
export const Searching: Story = { args: { step: 'searching' } };

/** P06 — Failure in words + mark, a fix checklist, and a retry that stays in the flow. */
export const NoDeviceFound: Story = { args: { step: 'notFound' } };

/** P07 — The whole row is the target; selected = teal border, check and "Selected". Click to toggle. */
export const OneDeviceFound: Story = {
  args: { step: 'found', found: [FOUND_MUSE], selectedId: FOUND_MUSE.id },
  render: function Render(args) {
    const [selectedId, setSelectedId] = useState(args.selectedId);
    return (
      <HeadsetSetup
        {...args}
        selectedId={selectedId}
        onSelectHeadset={(id) => {
          setSelectedId(selectedId === id ? undefined : id);
          args.onSelectHeadset(id);
        }}
      />
    );
  },
};

/** P08 — Names the exact device being connected; cancellable. */
export const Connecting: Story = {
  args: { step: 'connecting', found: [FOUND_MUSE], selectedId: FOUND_MUSE.id },
};

/** P09 — Try again reconnects the same device; Search again re-runs discovery. */
export const ConnectionFailed: Story = {
  args: { step: 'failed', found: [FOUND_MUSE], selectedId: FOUND_MUSE.id },
};

/** P10 — Confirms name and model; states nothing is recording. Next step is signal prep. */
export const Connected: Story = {
  args: { step: 'connected', found: [FOUND_MUSE], selectedId: FOUND_MUSE.id },
};

/** P11 — Fixture copy replaces the wearing graphic; no headset language. */
export const FixtureIntro: Story = {
  args: { step: 'wear', device: DEVICES.FIXTURE },
};

/** P12 — LSL: start the stream in other software first; explicit scan button. */
export const LSLIntro: Story = { args: { step: 'wear', device: DEVICES.LSL } };

/**
 * S01 — Phase 2, on Explore/Collect rather than the modal: prep checklist,
 * then what quality and noise mean, then per-sensor color + word + fix.
 */
export const SignalPrep: Story = {
  parameters: { surface: 'page' },
  render: () => (
    <SignalPrepPanel
      device={DEVICES.MUSE}
      sensors={MIXED_MUSE_SENSORS}
      onContinue={fn()}
    />
  ),
};

/** S02 — Crown: no snug-band step; all eight sensors show their scalp location. */
export const SignalPrepCrown: Story = {
  parameters: { surface: 'page' },
  render: () => (
    <SignalPrepPanel
      device={DEVICES.NEUROSITY}
      sensors={CROWN_SENSORS}
      onContinue={fn()}
    />
  ),
};
