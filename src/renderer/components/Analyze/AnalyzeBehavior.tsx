import React from 'react';
import Plot from 'react-plotly.js';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  AnalyzeLayout,
  DatasetChecklist,
  RailSection,
  ResultStatus,
  Segmented,
} from './AnalyzeParts';
import type { BehaviorPlot, DatasetOption } from './fixtures';

/** `aggregateDataForPlot`'s dependent variables. */
export type DependentVariable = 'Response Time' | 'Accuracy';

/** `aggregateDataForPlot`'s display modes. */
export type DisplayMode = 'errorbars' | 'datapoints' | 'whiskers';

export interface AnalyzeBehaviorProps {
  behaviorDatasets: DatasetOption[];
  selectedDatasets: string[];
  dependentVariable: DependentVariable;
  removeOutliers: boolean;
  showDataPoints: boolean;
  displayMode: DisplayMode;
  /** `aggregateDataForPlot` output for the current choices; null before any selection. */
  plot: BehaviorPlot | null;
  /** Result of the last `storeAggregatedBehaviorData`. */
  exportStatus: 'idle' | 'saving' | 'success' | 'error';
  onDatasetChange(values: string[]): void;
  onDependentVariableChange(value: DependentVariable): void;
  onToggleOutliers(): void;
  onToggleDataPoints(): void;
  onDisplayModeChange(mode: DisplayMode): void;
  onExport(): void;
}

/** What each plot type communicates, per measure. */
const CAPTIONS: Record<DisplayMode, Record<DependentVariable, string>> = {
  errorbars: {
    'Response Time':
      'Each bar is one participant’s average time for that image type. The thin line on top shows how precise that average is.',
    Accuracy:
      'Each bar is one participant’s percent correct for that image type. Taller means more correct answers.',
  },
  datapoints: {
    'Response Time':
      'Each dot is one correct trial. You can see how spread out the times are, and spot unusually fast or slow responses.',
    Accuracy:
      'Each dot is one participant’s percent correct for that image type.',
  },
  whiskers: {
    'Response Time':
      'The box holds the middle half of the times and the line inside is the median. The whiskers reach the rest, so you can compare spread as well as the middle.',
    Accuracy:
      'The box holds the middle half of the scores and the line inside is the median, so you can compare spread as well as the middle.',
  },
};

const EXPORT_FEEDBACK = {
  saving: 'Saving…',
  success: '✓ Saved to this workspace’s Data folder.',
  error:
    '✕ Couldn’t export: the selected recordings could not be read. Nothing was saved.',
};

/**
 * Behavior tab: choose complete behavioral recordings and how to plot them,
 * read the plot beside the controls, and export a per-participant summary.
 * Available before any EEG is cleaned. Pure props.
 */
export default function AnalyzeBehavior({
  behaviorDatasets,
  selectedDatasets,
  dependentVariable,
  removeOutliers,
  showDataPoints,
  displayMode,
  plot,
  exportStatus,
  onDatasetChange,
  onDependentVariableChange,
  onToggleOutliers,
  onToggleDataPoints,
  onDisplayModeChange,
  onExport,
}: AnalyzeBehaviorProps) {
  const rail = (
    <>
      <RailSection label="Recordings">
        <DatasetChecklist
          options={behaviorDatasets}
          selected={selectedDatasets}
          onChange={onDatasetChange}
        />
      </RailSection>
      <RailSection label="Plot" className="border-t border-gray-200 pt-[12px]">
        <Segmented
          label="Measure"
          value={dependentVariable}
          onChange={onDependentVariableChange}
          options={[
            { value: 'Response Time', text: 'Response time' },
            { value: 'Accuracy', text: 'Accuracy' },
          ]}
        />
        <Segmented
          label="Plot type"
          value={displayMode}
          onChange={onDisplayModeChange}
          options={[
            { value: 'errorbars', text: 'Bars' },
            { value: 'datapoints', text: 'Dots' },
            { value: 'whiskers', text: 'Box' },
          ]}
        />
        <label className="flex items-start gap-[8px] text-[14px] text-ink">
          <input
            type="checkbox"
            className="mt-[3px] h-[16px] w-[16px] accent-brand"
            checked={removeOutliers}
            onChange={onToggleOutliers}
          />
          <span>
            Remove outliers
            <span className="block text-[12px] leading-[1.35] text-ink-muted">
              Skips times far from the average (over 2 SD)
            </span>
          </span>
        </label>
        <label className="flex items-center gap-[8px] text-[14px] text-ink">
          <input
            type="checkbox"
            className="h-[16px] w-[16px] accent-brand"
            checked={showDataPoints}
            onChange={onToggleDataPoints}
          />
          Show data points
        </label>
      </RailSection>
      <RailSection
        label="Export"
        className="mt-auto border-t border-gray-200 pt-[12px]"
      >
        <Button
          size="lg"
          disabled={selectedDatasets.length === 0 || exportStatus === 'saving'}
          onClick={onExport}
        >
          Export summary CSV
        </Button>
        <div
          role="status"
          className={cn(
            'min-h-[18px] text-[13px] leading-[1.35]',
            exportStatus === 'error' ? 'text-red-700' : 'text-ink-muted',
            exportStatus === 'success' && 'text-brand'
          )}
        >
          {exportStatus === 'idle'
            ? 'One row per participant.'
            : EXPORT_FEEDBACK[exportStatus]}
        </div>
      </RailSection>
    </>
  );

  return (
    <AnalyzeLayout title="Behavior" rail={rail}>
      {selectedDatasets.length === 0 || !plot ? (
        <ResultStatus
          status="empty"
          title="Pick a recording to start"
          body="Tick one or more recordings. Each participant gets their own bar, dots or box."
        />
      ) : (
        <figure className="m-0 flex min-h-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white px-[16px] pb-[8px] pt-[12px]">
          <figcaption className="flex flex-none flex-col gap-[2px]">
            <h2 className="m-0 text-[18px] font-normal text-ink">
              {dependentVariable} by participant
            </h2>
            <div className="text-[14px] leading-[1.4] text-ink-muted">
              {CAPTIONS[displayMode][dependentVariable]}
            </div>
          </figcaption>
          <div className="min-h-0 flex-1">
            <Plot
              data={plot.dataToPlot}
              layout={{
                ...plot.layout,
                title: { text: '' },
                autosize: true,
                margin: { l: 64, r: 16, t: 28, b: 40 },
                font: { family: 'Lato, Helvetica Neue, sans-serif', size: 13 },
                legend: { orientation: 'h', x: 0, y: 1.08 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
              }}
              config={{ displayModeBar: false, responsive: true }}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </figure>
      )}
    </AnalyzeLayout>
  );
}
