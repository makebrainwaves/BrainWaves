import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { isNil } from 'lodash';
import Plot from 'react-plotly.js';
import type { Data as PlotlyData } from 'plotly.js';
import {
  DEVICES,
  MUSE_CHANNELS,
  EXPERIMENTS,
  SCREENS,
} from '../constants/constants';
import {
  readWorkspaceCleanedEEGData,
  getSubjectNamesFromFiles,
  readWorkspaceBehaviorData,
  readBehaviorData,
  storeAggregatedBehaviorData,
} from '../utils/filesystem/storage';
import {
  aggregateDataForPlot,
  aggregateBehaviorDataToSave,
} from '../utils/behavior/compute';
import SecondaryNavComponent from './SecondaryNavComponent';
import ClickableHeadDiagramSVG from './svgs/ClickableHeadDiagramSVG';
import PyodidePlotWidget from './PyodidePlotWidget';
import { HelpButton } from './CollectComponent/HelpSidebar';
import { PyodideActions } from '../actions/pyodideActions';
import { cn } from './ui/utils';

const ANALYZE_STEPS = {
  OVERVIEW: 'OVERVIEW',
  ERP: 'ERP',
  BEHAVIOR: 'BEHAVIOR',
};

const ANALYZE_STEPS_BEHAVIOR = {
  BEHAVIOR: 'BEHAVIOR',
};

interface Props {
  title: string;
  type: EXPERIMENTS;
  deviceType: DEVICES;
  isEEGEnabled: boolean;
  epochsInfo: Array<{
    [key: string]: number | string;
  }>;
  channelInfo: Array<string>;
  psdPlot: { [key: string]: string };
  topoPlot: { [key: string]: string };
  erpPlot: { [key: string]: string };
  PyodideActions: typeof PyodideActions;
}

export default function Analyze(props: Props) {
  const [activeStep, setActiveStep] = useState(
    props.isEEGEnabled === true
      ? ANALYZE_STEPS.OVERVIEW
      : ANALYZE_STEPS.BEHAVIOR
  );
  const [eegFilePaths, setEegFilePaths] = useState<
    Array<{ key: string; text: string; value: { name: string; dir: string } }>
  >([{ key: '', text: '', value: { name: '', dir: '' } }]);
  const [behaviorFilePaths, setBehaviorFilePaths] = useState<
    Array<{ key: string; text: string; value: string }>
  >([{ key: '', text: '', value: '' }]);
  const [dependentVariables, setDependentVariables] = useState<
    Array<{ key: string; text: string; value: string }>
  >([{ key: '', text: '', value: '' }]);
  const [dataToPlot, setDataToPlot] = useState<PlotlyData[]>([]);
  const [layout, setLayout] = useState<Record<string, unknown>>({});
  const [selectedDependentVariable, setSelectedDependentVariable] =
    useState('');
  const [removeOutliers, setRemoveOutliers] = useState(true);
  const [showDataPoints, setShowDataPoints] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState('errorbars');
  const [helpMode, setHelpMode] = useState('errorbars');
  const [selectedFilePaths, setSelectedFilePaths] = useState<Array<string>>([]);
  const [selectedBehaviorFilePaths, setSelectedBehaviorFilePaths] = useState<
    Array<string>
  >([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Array<string>>([]);
  const [selectedChannel, setSelectedChannel] = useState(MUSE_CHANNELS[0]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const workspaceCleanData = await readWorkspaceCleanedEEGData(props.title);
      const behavioralData = await readWorkspaceBehaviorData(props.title);
      if (cancelled) return;
      setEegFilePaths(
        workspaceCleanData.map((filepath) => ({
          key: filepath.name,
          text: filepath.name,
          value: filepath.path,
        }))
      );
      setBehaviorFilePaths(
        behavioralData.map((filepath) => ({
          key: filepath.name,
          text: filepath.name,
          value: filepath.path,
        }))
      );
      const dvs = ['Response Time', 'Accuracy'].map((dv) => ({
        key: dv,
        text: dv,
        value: dv,
      }));
      setDependentVariables(dvs);
      setSelectedDependentVariable('Response Time');
    })();
    return () => {
      cancelled = true;
    };
  }, [props.title]);

  function concatSubjectNames(subjects: Array<string | null | undefined>) {
    if (subjects.length < 1) return '';
    return subjects.reduce((acc, curr) => `${acc}-${curr}`);
  }

  function handleDatasetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const values = Array.from(e.target.selectedOptions, (o) => o.value);
    setSelectedFilePaths(values);
    setSelectedSubjects(getSubjectNamesFromFiles(values));
    props.PyodideActions.LoadCleanedEpochs(values);
  }

  function handleBehaviorDatasetChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const values = Array.from(e.target.selectedOptions, (o) => o.value);
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(values),
      selectedDependentVariable,
      removeOutliers,
      showDataPoints,
      displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot: data, layout: lay } = aggregatedData;
    setSelectedBehaviorFilePaths(values);
    setSelectedSubjects(getSubjectNamesFromFiles(values));
    setDataToPlot(data);
    setLayout(lay);
  }

  async function handleDropdownClick() {
    const behavioralData = await readWorkspaceBehaviorData(props.title);
    if (behavioralData.length !== behaviorFilePaths.length) {
      setBehaviorFilePaths(
        behavioralData.map((filepath) => ({
          key: filepath.name,
          text: filepath.name,
          value: filepath.path,
        }))
      );
    }
  }

  function handleDependentVariableChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const { value } = e.target;
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(selectedBehaviorFilePaths),
      value,
      removeOutliers,
      showDataPoints,
      displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot: data, layout: lay } = aggregatedData;
    setSelectedDependentVariable(value);
    setDataToPlot(data);
    setLayout(lay);
  }

  function handleRemoveOutliers() {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(selectedBehaviorFilePaths),
      selectedDependentVariable,
      !removeOutliers,
      showDataPoints,
      displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot: data, layout: lay } = aggregatedData;
    setRemoveOutliers(!removeOutliers);
    setDataToPlot(data);
    setLayout(lay);
    setHelpMode('outliers');
  }

  function handleDisplayModeChange(value: string) {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(selectedBehaviorFilePaths),
      selectedDependentVariable,
      removeOutliers,
      showDataPoints,
      value
    );
    if (!aggregatedData) return;
    const { dataToPlot: data, layout: lay } = aggregatedData;
    setDisplayMode(value);
    setDataToPlot(data);
    setLayout(lay);
    setHelpMode(value);
  }

  function handleDataPoints() {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(selectedBehaviorFilePaths),
      selectedDependentVariable,
      removeOutliers,
      !showDataPoints,
      displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot: data, layout: lay } = aggregatedData;
    setShowDataPoints(!showDataPoints);
    setDataToPlot(data);
    setLayout(lay);
  }

  function toggleDisplayInfoVisibility() {
    setIsSidebarVisible((prev) => !prev);
  }

  function saveSelectedDatasets() {
    const data = readBehaviorData(selectedBehaviorFilePaths);
    const aggregatedData = aggregateBehaviorDataToSave(data, removeOutliers);
    storeAggregatedBehaviorData(
      aggregatedData as Parameters<typeof storeAggregatedBehaviorData>[0],
      props.title
    );
  }

  function handleChannelSelect(channelName: string) {
    setSelectedChannel(channelName);
    props.PyodideActions.LoadERP(channelName);
  }

  function handleStepClick(step: string) {
    setActiveStep(step);
  }

  function renderEpochLabels() {
    const { epochsInfo } = props;
    if (!isNil(epochsInfo) && selectedFilePaths.length >= 1) {
      const numberConditions = epochsInfo.filter(
        (infoObj) =>
          infoObj.name !== 'Drop Percentage' && infoObj.name !== 'Total Epochs'
      ).length;
      const colors =
        numberConditions === 4
          ? ['red', 'yellow', 'green', 'blue']
          : ['red', 'green', 'teal', 'orange'];
      return (
        <div>
          {epochsInfo
            .filter(
              (infoObj) =>
                infoObj.name !== 'Drop Percentage' &&
                infoObj.name !== 'Total Epochs'
            )
            .map((infoObj, index) => (
              <div key={String(infoObj.name)}>
                <h4>{infoObj.name}</h4>
                <span style={{ color: colors[index] }}>●</span> {infoObj.value}
              </div>
            ))}
        </div>
      );
    }
    return <div />;
  }

  function renderHelpContent() {
    switch (helpMode) {
      case 'datapoints':
        return renderHelp(
          'Data Points',
          'In this graph, each dot refers to one data point, clustered by group (e.g., conditions).'
        );
      case 'errorbars':
        return renderHelp(
          'Bar Graph',
          'Bar graphs are the most common way to summarize data.'
        );
      case 'whiskers':
        return renderHelp(
          'Box Plot',
          'Box plots summarize the data in a more informative way.'
        );
      case 'outliers':
      default:
        return renderHelp(
          'Outliers',
          'A datapoint is tagged as an "outlier" if its value exceeds 2 standard deviations.'
        );
    }
  }

  function renderHelp(header: string, content: string) {
    return (
      <div className="text-lg h-[80%]">
        <button
          className="flex justify-end w-full"
          onClick={toggleDisplayInfoVisibility}
          aria-label="Close"
        >
          ✕
        </button>
        <h1 className="mb-4">{header}</h1>
        {content}
      </div>
    );
  }

  function renderOverview() {
    const { child: psdChild } = props.psdPlot;
    const { child: topoChild } = props.topoPlot;
    return (
      <div className="p-4">
        <h1 className="mb-2">Overview</h1>
        {renderEpochLabels()}
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              EEG Datasets
            </label>
            <select
              multiple
              className="w-full border border-gray-300 rounded p-1"
              value={selectedFilePaths}
              onChange={handleDatasetChange}
            >
              {eegFilePaths.map((fp) => (
                <option key={fp.key} value={fp.value as unknown as string}>
                  {fp.text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h2>PSD Plot</h2>
            {psdChild ? (
              <PyodidePlotWidget
                title={props.title}
                imageTitle="psd"
                plotMIMEBundle={props.psdPlot}
              />
            ) : (
              <p>No PSD data available. Clean some data first.</p>
            )}
          </div>
          <div>
            <h2>Topography</h2>
            {topoChild ? (
              <PyodidePlotWidget
                title={props.title}
                imageTitle="topo"
                plotMIMEBundle={props.topoPlot}
              />
            ) : (
              <p>No topography data available.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderERP() {
    return (
      <div className="flex h-full">
        <div className="flex-1 p-4">
          <h1 className="mb-4">ERP</h1>
          {props.erpPlot.child ? (
            <PyodidePlotWidget
              title={props.title}
              imageTitle="erp"
              plotMIMEBundle={props.erpPlot}
            />
          ) : (
            <p>No ERP data available.</p>
          )}
        </div>
        <div className="w-32 p-4 bg-white border-l border-gray-200">
          <ClickableHeadDiagramSVG
            channelinfo={props.channelInfo}
            onChannelClick={handleChannelSelect}
          />
          <div className="mt-4 space-y-2">
            {props.channelInfo.map((channel) => (
              <div
                key={channel}
                role="button"
                tabIndex={0}
                className={`text-sm p-1 cursor-pointer rounded ${
                  selectedChannel === channel
                    ? 'bg-brand text-white'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleChannelSelect(channel)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleChannelSelect(channel)
                }
              >
                {channel}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderBehavior() {
    return (
      <div className="flex flex-col p-4">
        <h1 className="mb-4">Behavioral Data</h1>
        <div className="flex gap-4 mb-4">
          <Button variant="secondary" onClick={handleDropdownClick}>
            Refresh datasets
          </Button>
          <Button variant="default" onClick={saveSelectedDatasets}>
            Download aggregated data
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              EEG Datasets
            </label>
            <select
              multiple
              className="w-full border border-gray-300 rounded p-1"
              value={selectedFilePaths}
              onChange={handleDatasetChange}
            >
              {eegFilePaths.map((fp) => (
                <option key={fp.key} value={fp.value as unknown as string}>
                  {fp.text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Behavioral Datasets
            </label>
            <select
              multiple
              className="w-full border border-gray-300 rounded p-1"
              value={selectedBehaviorFilePaths}
              onChange={handleBehaviorDatasetChange}
            >
              {behaviorFilePaths.map((fp) => (
                <option key={fp.key} value={fp.value}>
                  {fp.text}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Dependent Variable
          </label>
          <select
            className="w-full border border-gray-300 rounded p-1 mb-2"
            value={selectedDependentVariable}
            onChange={handleDependentVariableChange}
          >
            {dependentVariables.map((dv) => (
              <option key={dv.key} value={dv.value}>
                {dv.text}
              </option>
            ))}
          </select>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={removeOutliers}
                onChange={handleRemoveOutliers}
              />
              Remove outliers
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={showDataPoints}
                onChange={handleDataPoints}
              />
              Show data points
            </label>
          </div>
          <div className="flex gap-2 mb-2">
            <Button
              variant={displayMode === 'errorbars' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleDisplayModeChange('errorbars')}
            >
              Error bars
            </Button>
            <Button
              variant={displayMode === 'datapoints' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleDisplayModeChange('datapoints')}
            >
              Data Points
            </Button>
            <Button
              variant={displayMode === 'whiskers' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleDisplayModeChange('whiskers')}
            >
              Box Plot
            </Button>
          </div>
          <div className="h-96">
            {dataToPlot.length > 0 ? (
              <Plot
                data={dataToPlot}
                layout={layout}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <p>Select datasets to see plots.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const steps = props.isEEGEnabled ? ANALYZE_STEPS : ANALYZE_STEPS_BEHAVIOR;

  return (
    <div className="relative h-screen bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
      <SecondaryNavComponent
        title="Analyze"
        steps={steps}
        activeStep={activeStep}
        onStepClick={handleStepClick}
        saveButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDisplayInfoVisibility}
          >
            {isSidebarVisible ? 'Hide' : 'Show'} help
          </Button>
        }
      />
      {isSidebarVisible && renderHelpContent()}
      {activeStep === ANALYZE_STEPS.OVERVIEW && renderOverview()}
      {activeStep === ANALYZE_STEPS.ERP && renderERP()}
      {activeStep === ANALYZE_STEPS.BEHAVIOR && renderBehavior()}
    </div>
  );
}
