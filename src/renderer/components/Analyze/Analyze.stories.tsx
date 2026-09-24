import React, { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Link } from 'react-router-dom';
import { fn } from 'storybook/test';
import AppShell from '../AppShell/AppShell';
import SecondaryNavComponent from '../SecondaryNavComponent';
import AnalyzeOverview from './AnalyzeOverview';
import AnalyzeErp from './AnalyzeErp';
import AnalyzeBehavior from './AnalyzeBehavior';
import {
  ANALYZE_STEPS,
  ANALYZE_STEPS_BEHAVIOR,
  BEHAVIOR_DATASET_OPTIONS,
  EEG_DATASET_OPTIONS,
  EPOCHS_INFO,
  ERP_PLOT_MIME,
  MUSE_CHANNEL_INFO,
  PSD_PLOT_MIME,
  TOPO_PLOT_MIME,
  CONDITION_SUMMARIES,
  RT_ERRORBAR_PLOT,
  ACCURACY_ERRORBAR_PLOT,
  EMPTY_BEHAVIOR_PLOT,
  FACES_HOUSES_TITLE,
} from './fixtures';
import { SCREENS } from '../../constants/constants';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import type { AnalyzeOverviewProps } from './AnalyzeOverview';
import type { AnalyzeErpProps } from './AnalyzeErp';
import type { AnalyzeBehaviorProps } from './AnalyzeBehavior';

type AnalyzeStoryProps = {
  modality: 'eeg' | 'behavior';
  activeStep: 'OVERVIEW' | 'ERP' | 'BEHAVIOR';
  isEEGEnabled: boolean;
  /** Workspace badges shown in AppShell; derived from the story's data state. */
  badges?: { collect?: string[]; clean?: string[] };
  /** Recommended next area on the AppShell workflow nav. */
  nextArea?: 'prepare' | 'collect' | 'clean' | 'analyze';
  children: React.ReactNode;
};

/** Wrap a section in Analyze chrome: real AppShell, memory router, redesigned secondary nav. */
const withAnalyzeChrome: Decorator<AnalyzeStoryProps> = (
  Story,
  { args, parameters }
) => {
  const modality = args.modality ?? parameters.modality ?? 'eeg';
  const isEEGEnabled = args.isEEGEnabled ?? (modality === 'eeg');
  const steps = isEEGEnabled ? ANALYZE_STEPS : ANALYZE_STEPS_BEHAVIOR;
  const activeStep = args.activeStep ?? 'OVERVIEW';
  const badges = args.badges ?? parameters.badges;
  const nextArea = args.nextArea ?? parameters.nextArea;
  return (
    <MemoryRouter>
      <AppShell
        location="analyze"
        workspace={{
          name: FACES_HOUSES_TITLE,
          experimentType: 'Faces/Houses',
          modality,
        }}
        device="connected"
        deviceName="Muse 2"
        badges={badges}
        nextArea={nextArea}
      >
        <div className="flex h-full flex-col">
          <SecondaryNavComponent
            title="Analyze"
            steps={steps}
            activeStep={activeStep}
            onStepClick={fn()}
            isEEGEnabled={isEEGEnabled}
            onEEGEnabledChange={fn()}
          />
          <div className="flex-1 overflow-y-auto p-6 lg:p-9">
            <Story />
          </div>
        </div>
      </AppShell>
    </MemoryRouter>
  );
};

const meta: Meta<AnalyzeStoryProps> = {
  title: 'Domain/Analyze',
  component: ({ children }) => <>{children}</>,
  parameters: { layout: 'fullscreen' },
  decorators: [withAnalyzeChrome],
  args: {
    modality: 'eeg',
    activeStep: 'OVERVIEW',
    isEEGEnabled: true,
  },
};
export default meta;
type Story = StoryObj<AnalyzeStoryProps>;

function OverviewSection(props: Partial<AnalyzeOverviewProps>) {
  const [selected, setSelected] = useState<string[]>(props.selectedDatasets ?? []);
  return (
    <AnalyzeOverview
      status="results"
      title={FACES_HOUSES_TITLE}
      eegDatasets={EEG_DATASET_OPTIONS}
      selectedDatasets={selected}
      epochsInfo={EPOCHS_INFO}
      psdPlot={PSD_PLOT_MIME}
      topoPlot={TOPO_PLOT_MIME}
      onDatasetChange={setSelected}
      {...props}
    />
  );
}

function ErpSection(props: Partial<AnalyzeErpProps>) {
  const [channel, setChannel] = useState(props.selectedChannel ?? MUSE_CHANNEL_INFO[0]);
  return (
    <AnalyzeErp
      status="results"
      title={FACES_HOUSES_TITLE}
      eegAvailable
      eegDatasets={EEG_DATASET_OPTIONS}
      channelInfo={MUSE_CHANNEL_INFO}
      erpPlot={ERP_PLOT_MIME}
      selectedChannel={channel}
      epochsInfo={EPOCHS_INFO}
      conditions={CONDITION_SUMMARIES}
      onChannelSelect={setChannel}
      onRequestErp={fn()}
      {...props}
    />
  );
}

function BehaviorSection(props: Partial<AnalyzeBehaviorProps>) {
  const [selected, setSelected] = useState<string[]>(props.selectedDatasets ?? []);
  const [dependentVariable, setDependentVariable] = useState<AnalyzeBehaviorProps['dependentVariable']>(
    props.dependentVariable ?? 'Response Time'
  );
  const [removeOutliers, setRemoveOutliers] = useState(props.removeOutliers ?? false);
  const [showDataPoints, setShowDataPoints] = useState(props.showDataPoints ?? false);
  const [displayMode, setDisplayMode] = useState<AnalyzeBehaviorProps['displayMode']>(
    props.displayMode ?? 'errorbars'
  );
  const plotData = dependentVariable === 'Response Time' ? RT_ERRORBAR_PLOT : ACCURACY_ERRORBAR_PLOT;
  return (
    <AnalyzeBehavior
      behaviorOnly={false}
      behaviorDatasets={BEHAVIOR_DATASET_OPTIONS}
      selectedDatasets={selected}
      dependentVariable={dependentVariable}
      removeOutliers={removeOutliers}
      showDataPoints={showDataPoints}
      displayMode={displayMode}
      dataToPlot={plotData.dataToPlot}
      layout={plotData.layout}
      exportStatus="idle"
      onDatasetChange={setSelected}
      onDependentVariableChange={setDependentVariable}
      onToggleOutliers={() => setRemoveOutliers((v) => !v)}
      onToggleDataPoints={() => setShowDataPoints((v) => !v)}
      onDisplayModeChange={setDisplayMode}
      onExport={fn()}
      {...props}
    />
  );
}

/** A01 — Nothing to analyze yet; one action back to Collect. */
export const NoData: Story = {
  args: { modality: 'eeg', activeStep: 'OVERVIEW', isEEGEnabled: true },
  parameters: { modality: 'eeg', nextArea: 'collect' },
  render: () => (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h1 className="m-0">No results yet</h1>
      <p className="m-0 max-w-[560px] text-ink-muted">
        Analyze needs data from a run. Collect a recording first, then come back.
      </p>
    </div>
  ),
};

/** A02 — Behavior is ready; Overview/ERP explain the clean-data prerequisite. */
export const BehaviorBeforeCleaning: Story = {
  args: { modality: 'eeg', activeStep: 'OVERVIEW', isEEGEnabled: true },
  parameters: {
    modality: 'eeg',
    badges: { collect: ['4 recordings'] },
    nextArea: 'clean',
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <Card className="border-dashed border-amber-300 bg-amber-50/30">
        <CardContent className="pt-5">
          <h2 className="m-0 mb-2 text-xl font-light">Overview and ERP need cleaned EEG</h2>
          <p className="m-0 mb-4 max-w-[640px] text-ink-muted">
            You have behavioral data, but cleaned EEG is required for the EEG analyses. Clean a
            recording first; your behavior results stay available below.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to={SCREENS.CLEAN.route}>Go to Clean →</Link>
          </Button>
        </CardContent>
      </Card>
      <BehaviorSection />
    </div>
  ),
};

/** A03 — Cleaned datasets selected, with PSD and topography visible. */
export const OverviewResults: Story = {
  args: { modality: 'eeg', activeStep: 'OVERVIEW', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <OverviewSection selectedDatasets={[EEG_DATASET_OPTIONS[0].value]} />,
};

/** A04 — Explicit loading state while PSD/topo compute. */
export const OverviewLoading: Story = {
  args: { modality: 'eeg', activeStep: 'OVERVIEW', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <OverviewSection status="loading" psdPlot={null} topoPlot={null} />,
};

/** A05 — Error state with one retry action. */
export const OverviewError: Story = {
  args: { modality: 'eeg', activeStep: 'OVERVIEW', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <OverviewSection status="error" psdPlot={null} topoPlot={null} />,
};

/** A06 — ERP explainer + results side by side. */
export const ErpExplainer: Story = {
  args: { modality: 'eeg', activeStep: 'ERP', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <ErpSection selectedChannel="TP9" />,
};

/** A07 — Results state with channel and condition legend. */
export const ErpResults: Story = {
  args: { modality: 'eeg', activeStep: 'ERP', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <ErpSection selectedChannel="TP9" />,
};

/** A08 — ERP panel before any channel is selected. */
export const ErpNoResult: Story = {
  args: { modality: 'eeg', activeStep: 'ERP', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <ErpSection status="noData" erpPlot={null} />,
};

/** A09 — ERP loading spinner in full chrome. */
export const ErpLoading: Story = {
  args: { modality: 'eeg', activeStep: 'ERP', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <ErpSection status="loading" erpPlot={null} />,
};

/** A10 — ERP error with retry. */
export const ErpError: Story = {
  args: { modality: 'eeg', activeStep: 'ERP', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <ErpSection status="error" erpPlot={null} />,
};

/** A11 — Behavior results with controls active. */
export const BehaviorResults: Story = {
  args: { modality: 'eeg', activeStep: 'BEHAVIOR', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => <BehaviorSection selectedDatasets={[BEHAVIOR_DATASET_OPTIONS[0].value]} />,
};

/** A12 — Export success feedback visible. */
export const BehaviorExport: Story = {
  args: { modality: 'eeg', activeStep: 'BEHAVIOR', isEEGEnabled: true },
  parameters: { modality: 'eeg', badges: { collect: ['4 recordings'], clean: ['3 cleaned'] }, nextArea: 'analyze' },
  render: () => (
    <BehaviorSection
      selectedDatasets={[BEHAVIOR_DATASET_OPTIONS[0].value]}
      exportStatus="success"
    />
  ),
};

/** A13 — Behavior-only workspace: no Overview/ERP tabs, no Clean references. */
export const BehaviorOnlyWorkspace: Story = {
  args: { modality: 'behavior', activeStep: 'BEHAVIOR', isEEGEnabled: false },
  parameters: {
    modality: 'behavior',
    badges: { collect: ['4 recordings'] },
    nextArea: 'analyze',
  },
  render: () => <BehaviorSection behaviorOnly />,
};
