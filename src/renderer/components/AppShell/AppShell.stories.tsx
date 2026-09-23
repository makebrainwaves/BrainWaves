import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AppShell from './AppShell';
import BlockedAreaPanel from './BlockedAreaEmptyState';
import { AREA_LABELS } from './WorkflowNav';
import { Area, ShellWorkspace } from './types';
import { Button } from '../ui/button';

const facesHouses: ShellWorkspace = {
  name: 'Faces_Houses_3',
  experimentType: 'Faces/Houses',
  modality: 'eeg',
};
const stroop: ShellWorkspace = {
  name: 'Stroop_2',
  experimentType: 'Stroop',
  modality: 'behavior',
};

/** Striped stand-in for existing screens that this redesign leaves unchanged. */
function Placeholder({ label, height }: { label: string; height: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center rounded-[6px] border border-dashed border-[#d4d4de] bg-[repeating-linear-gradient(135deg,#f3f3f8_0_10px,#fafafd_10px_20px)] font-mono text-[12px] text-ink-muted"
    >
      {label}
    </div>
  );
}

/** Fixture area body: heading, guidance, one CTA to the recommended area. */
function AreaPreview({
  area,
  title,
  text,
  cta,
}: {
  area: Area;
  title: string;
  text: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-[12px] px-[56px] pb-[48px] pt-[40px]">
      <h1 className="m-0 !text-[32px] !font-light !leading-tight !tracking-[0.3px]">
        {title}
      </h1>
      <p className="m-0 max-w-[640px] !text-[17px] leading-[1.55] !tracking-normal [text-wrap:pretty]">
        {text}
      </p>
      <div className="mt-[8px] flex gap-[12px]">
        <Button size="lg">{cta}</Button>
      </div>
      <div className="mt-[20px]">
        <Placeholder
          label={`${AREA_LABELS[area]} area content — unchanged`}
          height={150}
        />
      </div>
    </div>
  );
}

const meta: Meta<typeof AppShell> = {
  title: 'Domain/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    device: 'connected',
    deviceName: 'Muse 2',
    onSelectArea: fn(),
    onHome: fn(),
    onEndRun: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof AppShell>;

/** S01 — Home is the current place. No workspace identity, no workflow. */
export const NoActiveWorkspace: Story = {
  args: {
    location: 'home',
    device: 'none',
    children: (
      <div className="px-[56px] pb-[40px] pt-[32px]">
        <Placeholder label="Home landing — see Home stories" height={140} />
      </div>
    ),
  },
};

/** S02 — Four areas. Prepare is current; Collect is recommended. */
export const EegPrepare: Story = {
  args: {
    location: 'prepare',
    workspace: facesHouses,
    nextArea: 'collect',
    children: (
      <AreaPreview
        area="prepare"
        title="Get ready to record"
        text="Read the protocol and try the practice round. When you feel ready, head to Collect and record your first participant."
        cta="Go to Collect"
      />
    ),
  },
};

/** S03 — Clean is omitted and areas renumber. No headset is fine here. */
export const BehaviorPrepare: Story = {
  args: {
    location: 'prepare',
    workspace: stroop,
    nextArea: 'collect',
    device: 'none',
    children: (
      <AreaPreview
        area="prepare"
        title="Get ready to run"
        text="This workspace records key presses and reaction times only — no headset needed."
        cta="Go to Collect"
      />
    ),
  },
};

/** S04 — Factual badge on Collect; Clean is Next. */
export const RawWaitingForClean: Story = {
  args: {
    location: 'collect',
    workspace: facesHouses,
    nextArea: 'clean',
    badges: { collect: ['4 recordings'] },
    children: (
      <AreaPreview
        area="collect"
        title="4 recordings saved"
        text="Your raw EEG is ready. Clean it next to remove blinks and noise before you look at results."
        cta="Go to Clean"
      />
    ),
  },
};

/** S05 — Current (Analyze) and recommended (Clean) are different areas and look different. */
export const AnalyzeBehaviorCleanNext: Story = {
  args: {
    location: 'analyze',
    workspace: facesHouses,
    nextArea: 'clean',
    badges: { collect: ['4 recordings'] },
    children: (
      <AreaPreview
        area="analyze"
        title="Behavior results"
        text="Reaction times and accuracy from your 4 recordings are here. Brain results need cleaned EEG — Clean is still next."
        cta="Go to Clean"
      />
    ),
  },
};

/** S06 — Two factual badges. Device chip shows Fixture. */
export const CleanedReadyForAnalyze: Story = {
  args: {
    location: 'clean',
    workspace: facesHouses,
    nextArea: 'analyze',
    badges: { collect: ['4 recordings'], clean: ['3 cleaned'] },
    device: 'fixture',
    children: (
      <AreaPreview
        area="clean"
        title="3 of 4 recordings cleaned"
        text="You have enough clean data to compare faces and houses. You can clean the last one later."
        cta="Go to Analyze"
      />
    ),
  },
};

/** S07 — Blocked areas stay selectable and explain what's missing. */
export const BlockedAreaEmptyState: Story = {
  args: {
    location: 'clean',
    workspace: facesHouses,
    nextArea: 'collect',
    children: (
      <BlockedAreaPanel
        title="Nothing to clean yet"
        body="Clean works on EEG recordings, and this workspace doesn’t have any. Record one in Collect, then come back."
        onCollect={fn()}
      />
    ),
  },
};

/** S08 — Navigation is replaced. Recording is stated in words, not just a red dot. */
export const RunEeg: Story = {
  args: {
    location: 'collect',
    workspace: facesHouses,
    run: { kind: 'eeg', elapsed: '02:14' },
    children: (
      <div className="px-[56px] pb-[40px] pt-[32px]">
        <Placeholder
          label="experiment runtime (trials) — unchanged"
          height={300}
        />
      </div>
    ),
  },
};

/** S09 — Square glyph and "no EEG" copy distinguish it from an EEG run. */
export const RunBehavior: Story = {
  args: {
    location: 'collect',
    workspace: stroop,
    device: 'none',
    run: { kind: 'behavior', elapsed: '01:02' },
    children: (
      <div className="px-[56px] pb-[40px] pt-[32px]">
        <Placeholder
          label="experiment runtime (trials) — unchanged"
          height={300}
        />
      </div>
    ),
  },
};
