import React, { useMemo, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';
import AppShell from '../AppShell/AppShell';
import BlockedAreaEmptyState from '../AppShell/BlockedAreaEmptyState';
import type { Area } from '../AppShell/types';
import SecondaryNavComponent from '../SecondaryNavComponent';
import { aggregateDataForPlot } from '../../utils/behavior/compute';
import AnalyzeOverview, { AnalyzeOverviewProps } from './AnalyzeOverview';
import AnalyzeErp, { AnalyzeErpProps, ErpWalkthroughStep } from './AnalyzeErp';
import AnalyzeBehavior, {
  AnalyzeBehaviorProps,
  DependentVariable,
  DisplayMode,
} from './AnalyzeBehavior';
import {
  BEHAVIOR_CSVS,
  BEHAVIOR_DATASET_OPTIONS,
  BehaviorPlot,
  EEG_DATASET_OPTIONS,
  EPOCHS_INFO,
  EXAMPLE_EPOCH_ARRAYS,
  FACES_HOUSES_CODE_TO_LABEL,
  MUSE_CHANNEL_INFO,
  PSD_PLOT_MIME,
  TOPO_PLOT_MIME,
  WORKSPACE_TITLE,
  erpPlotMime,
} from './fixtures';

type Tab = 'OVERVIEW' | 'ERP' | 'BEHAVIOR';

interface ChromeParameters {
  modality?: 'eeg' | 'behavior';
  tab?: Tab;
  /** Shell badges for the story's data state (`useWorkspaceProgress.summarize`). */
  badges?: Partial<Record<Area, string[]>>;
  nextArea?: Area;
  /** WorkspaceAreaGate replaces the whole screen, tab bar included. */
  gated?: boolean;
}

/** Shell facts for an EEG workspace with 4 recordings, 3 of them cleaned. */
const CLEANED: ChromeParameters = {
  badges: { collect: ['4 recordings'], clean: ['3 cleaned'] },
  nextArea: 'analyze',
};

/** Shell facts for an EEG workspace with 4 recordings and nothing cleaned yet. */
const NOT_CLEANED: ChromeParameters = {
  badges: { collect: ['4 recordings'] },
  nextArea: 'clean',
};

/**
 * Storybook deep-merges object parameters, so stories set `badges` whole and
 * the cleaned-workspace default lives here rather than in `meta.parameters`.
 *
 * The real chrome around Analyze: AppShell at `analyze` with the story's
 * workspace facts, then Analyze's tab bar (Overview / ERP / Behavior, or
 * Behavior only). The tab body fills the rest without page scroll.
 */
const withAnalyzeChrome: Decorator = (Story, { parameters }) => {
  const {
    modality = 'eeg',
    tab = 'OVERVIEW',
    badges = CLEANED.badges,
    nextArea = CLEANED.nextArea,
    gated,
  } = parameters as ChromeParameters;
  const eeg = modality === 'eeg';
  return (
    <MemoryRouter>
      <AppShell
        location="analyze"
        workspace={{
          name: eeg ? WORKSPACE_TITLE : 'Faces_Houses_4',
          experimentType: 'Faces/Houses',
          modality,
        }}
        device={eeg ? 'connected' : 'none'}
        deviceName="Muse 2"
        badges={badges}
        nextArea={nextArea}
      >
        {gated ? (
          <Story />
        ) : (
          <div className="flex h-full flex-col">
            <SecondaryNavComponent
              title="Analyze"
              steps={
                eeg
                  ? { OVERVIEW: 'OVERVIEW', ERP: 'ERP', BEHAVIOR: 'BEHAVIOR' }
                  : { BEHAVIOR: 'BEHAVIOR' }
              }
              activeStep={tab}
              onStepClick={fn()}
              isEEGEnabled={eeg}
              onEEGEnabledChange={fn()}
            />
            <div className="min-h-0 flex-1">
              <Story />
            </div>
          </div>
        )}
      </AppShell>
    </MemoryRouter>
  );
};

const meta: Meta = {
  title: 'Domain/Analyze',
  parameters: { layout: 'fullscreen' },
  decorators: [withAnalyzeChrome],
};
export default meta;
type Story = StoryObj;

/** Overview with local dataset selection; everything else fixed by the story. */
function Overview(props: Partial<AnalyzeOverviewProps>) {
  const [selected, setSelected] = useState(
    props.selectedDatasets ?? [EEG_DATASET_OPTIONS[0].value]
  );
  return (
    <AnalyzeOverview
      status="results"
      eegAvailable
      workspaceTitle={WORKSPACE_TITLE}
      eegDatasets={EEG_DATASET_OPTIONS}
      epochsInfo={EPOCHS_INFO}
      psdPlot={PSD_PLOT_MIME}
      topoPlot={TOPO_PLOT_MIME}
      onRetry={fn()}
      onGoToClean={fn()}
      {...props}
      selectedDatasets={selected}
      onDatasetChange={setSelected}
    />
  );
}

/** ERP with a live sensor pick and walkthrough; the plot follows the sensor. */
function Erp(props: Partial<AnalyzeErpProps>) {
  const [channel, setChannel] = useState<string | null>(
    props.selectedChannel === undefined ? 'TP9' : props.selectedChannel
  );
  const [step, setStep] = useState<ErpWalkthroughStep>(
    props.walkthroughStep ?? 0
  );
  return (
    <AnalyzeErp
      status="results"
      eegAvailable
      workspaceTitle={WORKSPACE_TITLE}
      channelInfo={MUSE_CHANNEL_INFO}
      epochsInfo={EPOCHS_INFO}
      epochArrays={EXAMPLE_EPOCH_ARRAYS}
      codeToLabel={FACES_HOUSES_CODE_TO_LABEL}
      onRetry={fn()}
      onGoToClean={fn()}
      {...props}
      selectedChannel={channel}
      erpPlot={channel ? erpPlotMime(channel) : null}
      walkthroughStep={step}
      onChannelSelect={setChannel}
      onWalkthroughStepChange={setStep}
    />
  );
}

/** Behavior plotted by the real `aggregateDataForPlot` from the example CSVs. */
function Behavior(props: Partial<AnalyzeBehaviorProps>) {
  const [selected, setSelected] = useState(
    props.selectedDatasets ?? BEHAVIOR_DATASET_OPTIONS.slice(0, 3).map((o) => o.value)
  );
  const [dependentVariable, setDependentVariable] =
    useState<DependentVariable>('Response Time');
  const [removeOutliers, setRemoveOutliers] = useState(true);
  const [showDataPoints, setShowDataPoints] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('errorbars');
  const plot = useMemo(
    () =>
      (aggregateDataForPlot(
        selected.map((path) => BEHAVIOR_CSVS[path]),
        dependentVariable,
        removeOutliers,
        showDataPoints,
        displayMode
      ) as BehaviorPlot | undefined) ?? null,
    [selected, dependentVariable, removeOutliers, showDataPoints, displayMode]
  );
  return (
    <AnalyzeBehavior
      behaviorDatasets={BEHAVIOR_DATASET_OPTIONS}
      exportStatus="idle"
      onExport={fn()}
      {...props}
      selectedDatasets={selected}
      dependentVariable={dependentVariable}
      removeOutliers={removeOutliers}
      showDataPoints={showDataPoints}
      displayMode={displayMode}
      plot={plot}
      onDatasetChange={setSelected}
      onDependentVariableChange={setDependentVariable}
      onToggleOutliers={() => setRemoveOutliers((v) => !v)}
      onToggleDataPoints={() => setShowDataPoints((v) => !v)}
      onDisplayModeChange={setDisplayMode}
    />
  );
}

/** A01 — No data at all: WorkspaceAreaGate's blocked state, one action to Collect. */
export const NoData: Story = {
  parameters: { gated: true, badges: {}, nextArea: 'collect' },
  render: () => (
    <BlockedAreaEmptyState
      title="No results yet"
      body="Analyze needs data from a run. Collect a recording first, then come back."
      onCollect={fn()}
    />
  ),
};

/** A02 — Behavior is complete, no EEG is cleaned: Overview explains why and offers Go to Clean. Clean is Next in the shell. */
export const BehaviorBeforeCleaning: Story = {
  parameters: { ...NOT_CLEANED, tab: 'OVERVIEW' },
  render: () => <Overview eegAvailable={false} />,
};

/** A02b — Same workspace, ERP tab: the same prerequisite, one Go to Clean. */
export const ErpCleanRequired: Story = {
  parameters: { ...NOT_CLEANED, tab: 'ERP' },
  render: () => <Erp eegAvailable={false} />,
};

/** A02c — Same workspace, Behavior tab: fully usable before cleaning. */
export const BehaviorBeforeCleaningBehaviorTab: Story = {
  parameters: { ...NOT_CLEANED, tab: 'BEHAVIOR' },
  render: () => <Behavior />,
};

/** A03 — Rail: tick recordings (P01 here, whose example epochs feed every EEG story), see who's included. Results: PSD and per-sensor ERPs side by side. */
export const OverviewResults: Story = {
  render: () => <Overview />,
};

/** A03b — Comparison for review: plots on top, a compact recordings strip below. One of A03/A03b gets deleted. */
export const CompareOverviewPlotsFirst: Story = {
  render: () => <Overview arrangement="plotsFirst" />,
};

/** A04 — Loading in the results area; the rail stays usable. */
export const OverviewLoading: Story = {
  render: () => <Overview status="loading" />,
};

/** A05 — Analysis error in words, with Try again. */
export const OverviewError: Story = {
  render: () => <Overview status="error" />,
};

/** E01 — Graph first: the MNE ERP for the picked sensor, then an invitation to the walkthrough. Uses example epochs. */
export const ErpResults: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp />,
};

/** E02 — Walkthrough 1/4, example epochs: every trial as a faint line, one highlighted. */
export const ErpWalkthroughStep1: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp walkthroughStep={1} />,
};

/** E03 — Walkthrough 2/4, example epochs: the mean of all trials, computed from the arrays. */
export const ErpWalkthroughStep2: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp walkthroughStep={2} />,
};

/** E04 — Walkthrough 3/4, example epochs: one mean per image type; solid vs dashed plus end labels. */
export const ErpWalkthroughStep3: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp walkthroughStep={3} />,
};

/** E05 — Walkthrough 4/4, example epochs: the ~170 ms window, worded as "may". */
export const ErpWalkthroughStep4: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp walkthroughStep={4} />,
};

/** E06 — No sensor picked yet. */
export const ErpNoResult: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp status="empty" selectedChannel={null} />,
};

/** E07 — ERP computing for the picked sensor. */
export const ErpLoading: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp status="loading" />,
};

/** E08 — ERP failed, with Try again. */
export const ErpError: Story = {
  parameters: { tab: 'ERP' },
  render: () => <Erp status="error" />,
};

/** B01 — Rail: recordings, measure, plot type, outliers. Plot beside it, with what it shows. */
export const BehaviorResults: Story = {
  parameters: { tab: 'BEHAVIOR' },
  render: () => <Behavior />,
};

/** B02 — Export succeeded: said in words next to the button. */
export const BehaviorExport: Story = {
  parameters: { tab: 'BEHAVIOR' },
  render: () => <Behavior exportStatus="success" />,
};

/** B03 — Export failed: said in words, nothing saved. */
export const BehaviorExportFailed: Story = {
  parameters: { tab: 'BEHAVIOR' },
  render: () => <Behavior exportStatus="error" />,
};

/** B04 — Behavior-only workspace: Behavior tab only, no Clean area, no EEG copy. */
export const BehaviorOnlyWorkspace: Story = {
  parameters: {
    modality: 'behavior',
    tab: 'BEHAVIOR',
    badges: { collect: ['4 recordings'] },
    nextArea: 'analyze',
  },
  render: () => <Behavior />,
};
