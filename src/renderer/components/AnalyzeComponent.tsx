import React, { useEffect, useMemo, useState } from 'react';
import type { EpochArraysMeta } from '../actions';
import { ExperimentActions, PyodideActions } from '../actions';
import { ExperimentParameters } from '../constants/interfaces';
import {
  readWorkspaceCleanedEEGData,
  readWorkspaceBehaviorData,
  readBehaviorData,
  storeAggregatedBehaviorData,
} from '../utils/filesystem/storage';
import {
  aggregateDataForPlot,
  aggregateBehaviorDataToSave,
} from '../utils/behavior/compute';
import { resolveMarkerRegistry } from '../utils/eeg/markerRegistry';
import SecondaryNavComponent from './SecondaryNavComponent';
import { AREA_ROUTES } from './AppShell/areas';
import AnalyzeOverview from './Analyze/AnalyzeOverview';
import AnalyzeErp, { ErpWalkthroughStep } from './Analyze/AnalyzeErp';
import AnalyzeBehavior, {
  AnalyzeBehaviorProps,
  DependentVariable,
  DisplayMode,
} from './Analyze/AnalyzeBehavior';
import type {
  BehaviorPlot,
  DatasetOption,
  EpochInfoRow,
} from './Analyze/fixtures';

const ANALYZE_STEPS = {
  OVERVIEW: 'OVERVIEW',
  ERP: 'ERP',
  BEHAVIOR: 'BEHAVIOR',
};

const ANALYZE_STEPS_BEHAVIOR = {
  BEHAVIOR: 'BEHAVIOR',
};

type PlotMime = { [key: string]: string } | null | undefined;

interface Props {
  title: string;
  isEEGEnabled: boolean;
  params: ExperimentParameters | null;
  epochsInfo: EpochInfoRow[];
  channelInfo: string[];
  psdPlot: PlotMime;
  topoPlot: PlotMime;
  erpPlot: PlotMime;
  cleanedEpochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  /** Plot keys whose last request raised in Python (`pyodide.failedPlots`). */
  failedPlots: string[];
  ExperimentActions: typeof ExperimentActions;
  PyodideActions: typeof PyodideActions;
  navigate: (route: string) => void;
}

/**
 * Analyze screen: Overview, ERP and Behavior tabs (EEG tabs only when EEG is
 * on) wired from Redux and the workspace listings into the approved
 * `Analyze/` components.
 */
export default function Analyze(props: Props) {
  const [activeStep, setActiveStep] = useState(
    props.isEEGEnabled ? ANALYZE_STEPS.OVERVIEW : ANALYZE_STEPS.BEHAVIOR
  );
  /** Null until the cleaned listing is read, so "Clean first" never flashes. */
  const [eegDatasets, setEegDatasets] = useState<DatasetOption[] | null>(null);
  const [behaviorDatasets, setBehaviorDatasets] = useState<DatasetOption[]>([]);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [walkthroughStep, setWalkthroughStep] = useState<ErpWalkthroughStep>(0);
  const [selectedBehaviorFilePaths, setSelectedBehaviorFilePaths] = useState<
    string[]
  >([]);
  const [dependentVariable, setDependentVariable] =
    useState<DependentVariable>('Response Time');
  const [removeOutliers, setRemoveOutliers] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('errorbars');
  const [behaviorPlot, setBehaviorPlot] = useState<BehaviorPlot | null>(null);
  const [exportStatus, setExportStatus] =
    useState<AnalyzeBehaviorProps['exportStatus']>('idle');

  const codeToLabel = useMemo(
    () => resolveMarkerRegistry(props.params).codeToLabel,
    [props.params]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const workspaceCleanData = await readWorkspaceCleanedEEGData(props.title);
      const behavioralData = await readWorkspaceBehaviorData(props.title);
      if (cancelled) return;
      setEegDatasets(
        workspaceCleanData.map((file) => ({
          key: file.name,
          text: file.name,
          value: file.path,
        }))
      );
      setBehaviorDatasets(
        behavioralData.map((file) => ({
          key: file.name,
          text: file.name,
          value: file.path,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [props.title]);

  useEffect(() => {
    setExportStatus('idle');
    if (selectedBehaviorFilePaths.length === 0) {
      setBehaviorPlot(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const plot = aggregateDataForPlot(
        await readBehaviorData(selectedBehaviorFilePaths),
        dependentVariable,
        removeOutliers,
        displayMode
      );
      if (!cancelled) setBehaviorPlot(plot ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    selectedBehaviorFilePaths,
    dependentVariable,
    removeOutliers,
    displayMode,
  ]);

  function handleDatasetChange(values: string[]) {
    setSelectedFilePaths(values);
    setSelectedChannel(null);
    setWalkthroughStep(0);
    props.PyodideActions.LoadCleanedEpochs(values);
  }

  function handleChannelSelect(channel: string) {
    setSelectedChannel(channel);
    setWalkthroughStep(0);
    props.PyodideActions.LoadERP(channel);
  }

  function handleEEGEnabled(enabled: boolean) {
    props.ExperimentActions.SetEEGEnabled(enabled);
    props.ExperimentActions.SaveWorkspace();
    if (!enabled) setActiveStep(ANALYZE_STEPS.BEHAVIOR);
  }

  async function handleExport() {
    setExportStatus('saving');
    try {
      const aggregatedData = aggregateBehaviorDataToSave(
        await readBehaviorData(selectedBehaviorFilePaths),
        removeOutliers
      );
      if (!aggregatedData) {
        setExportStatus('error');
        return;
      }
      const saved = await storeAggregatedBehaviorData(
        aggregatedData,
        props.title
      );
      setExportStatus(saved ? 'success' : 'idle');
    } catch {
      setExportStatus('error');
    }
  }

  const eegAvailable = !!eegDatasets && eegDatasets.length > 0;
  const hasSelection = selectedFilePaths.length > 0;
  const failed = (key: string) => props.failedPlots.includes(key);

  let overviewStatus: 'results' | 'loading' | 'error' = 'loading';
  if (failed('psd') || failed('topo')) overviewStatus = 'error';
  else if (props.psdPlot && props.topoPlot) overviewStatus = 'results';

  let erpStatus: 'results' | 'loading' | 'error' | 'empty' = 'loading';
  if (!hasSelection || !selectedChannel) erpStatus = 'empty';
  else if (failed('erp')) erpStatus = 'error';
  else if (props.erpPlot) erpStatus = 'results';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SecondaryNavComponent
        title="Analyze"
        steps={props.isEEGEnabled ? ANALYZE_STEPS : ANALYZE_STEPS_BEHAVIOR}
        activeStep={activeStep}
        onStepClick={setActiveStep}
        isEEGEnabled={props.isEEGEnabled}
        onEEGEnabledChange={handleEEGEnabled}
      />
      <div className="min-h-0 flex-1">
        {activeStep === ANALYZE_STEPS.OVERVIEW && eegDatasets && (
          <AnalyzeOverview
            status={overviewStatus}
            eegAvailable={eegAvailable}
            workspaceTitle={props.title}
            eegDatasets={eegDatasets}
            selectedDatasets={selectedFilePaths}
            epochsInfo={props.epochsInfo}
            psdPlot={props.psdPlot ?? null}
            topoPlot={props.topoPlot ?? null}
            onDatasetChange={handleDatasetChange}
            onRetry={() => handleDatasetChange(selectedFilePaths)}
            onGoToClean={() => props.navigate(AREA_ROUTES.clean)}
          />
        )}
        {activeStep === ANALYZE_STEPS.ERP && eegDatasets && (
          <AnalyzeErp
            status={erpStatus}
            eegAvailable={eegAvailable}
            workspaceTitle={props.title}
            channelInfo={hasSelection ? props.channelInfo : []}
            selectedChannel={selectedChannel}
            erpPlot={props.erpPlot ?? null}
            epochsInfo={hasSelection ? props.epochsInfo : []}
            epochArrays={props.cleanedEpochArrays}
            codeToLabel={codeToLabel}
            walkthroughStep={walkthroughStep}
            onChannelSelect={handleChannelSelect}
            onWalkthroughStepChange={setWalkthroughStep}
            onRetry={() =>
              selectedChannel && props.PyodideActions.LoadERP(selectedChannel)
            }
            onGoToClean={() => props.navigate(AREA_ROUTES.clean)}
          />
        )}
        {activeStep === ANALYZE_STEPS.BEHAVIOR && (
          <AnalyzeBehavior
            behaviorDatasets={behaviorDatasets}
            selectedDatasets={selectedBehaviorFilePaths}
            dependentVariable={dependentVariable}
            removeOutliers={removeOutliers}
            displayMode={displayMode}
            plot={behaviorPlot}
            exportStatus={exportStatus}
            onDatasetChange={setSelectedBehaviorFilePaths}
            onDependentVariableChange={setDependentVariable}
            onToggleOutliers={() => setRemoveOutliers((value) => !value)}
            onDisplayModeChange={setDisplayMode}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
}
