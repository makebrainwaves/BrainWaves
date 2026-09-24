import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import Plot from 'react-plotly.js';
import type { Data as PlotlyData } from 'plotly.js';
import type { BehaviorDatasetOption, DisplayMode } from './fixtures';

export type ExportStatus = 'idle' | 'success' | 'error';

export interface AnalyzeBehaviorProps {
  /** Whether this workspace is behavior-only (no EEG component at all). */
  behaviorOnly: boolean;
  behaviorDatasets: BehaviorDatasetOption[];
  selectedDatasets: string[];
  dependentVariable: 'Response Time' | 'Accuracy';
  removeOutliers: boolean;
  showDataPoints: boolean;
  displayMode: DisplayMode;
  dataToPlot: PlotlyData[];
  layout: Record<string, unknown>;
  exportStatus: ExportStatus;
  onDatasetChange: (values: string[]) => void;
  onDependentVariableChange: (value: 'Response Time' | 'Accuracy') => void;
  onToggleOutliers: () => void;
  onToggleDataPoints: () => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onExport: () => void;
}

const DEPENDENT_VARIABLES: { key: string; text: string; value: 'Response Time' | 'Accuracy' }[] = [
  { key: 'Response Time', text: 'Response Time', value: 'Response Time' },
  { key: 'Accuracy', text: 'Accuracy', value: 'Accuracy' },
];

function ExplainBehavior({ mode }: { mode: DisplayMode }) {
  const text: Record<DisplayMode, string> = {
    errorbars:
      'Bar graph: the height of each bar shows the average for that condition, and the error bars show how much the values vary.',
    datapoints:
      'Data points: every participant’s value is shown as a dot. This lets you see the spread and any clusters or outliers.',
    whiskers:
      'Box plot: the box covers the middle 50% of values, the line inside is the median, and the whiskers show the full range.',
  };
  return (
    <p className="m-0 text-ink-muted">
      {text[mode]}
    </p>
  );
}

export default function AnalyzeBehavior({
  behaviorOnly,
  behaviorDatasets,
  selectedDatasets,
  dependentVariable,
  removeOutliers,
  showDataPoints,
  displayMode,
  dataToPlot,
  layout,
  exportStatus,
  onDatasetChange,
  onDependentVariableChange,
  onToggleOutliers,
  onToggleDataPoints,
  onDisplayModeChange,
  onExport,
}: AnalyzeBehaviorProps) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="m-0 mb-1">{behaviorOnly ? 'Behavior' : 'Behavioral Data'}</h1>
        <p className="m-0 mb-4 max-w-[720px] text-ink-muted">
          Look at how participants responded: were they fast or accurate? Choose the visualization that
          best tells your research story.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="m-0 text-lg font-light">Datasets</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              multiple
              className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white p-2 text-sm"
              value={selectedDatasets}
              onChange={(e) => onDatasetChange(Array.from(e.target.selectedOptions, (o) => o.value))}
            >
              {behaviorDatasets.map((ds) => (
                <option key={ds.key} value={ds.value}>
                  {ds.text}
                </option>
              ))}
            </select>
            <p className="m-0 text-xs text-ink-muted">
              Tip: hold Cmd (Mac) or Ctrl (Windows) to select more than one file.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="m-0 text-lg font-light">Plot options</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Measure</label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm"
                  value={dependentVariable}
                  onChange={(e) => onDependentVariableChange(e.target.value as 'Response Time' | 'Accuracy')}
                >
                  {DEPENDENT_VARIABLES.map((dv) => (
                    <option key={dv.key} value={dv.value}>
                      {dv.text}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removeOutliers}
                    onChange={onToggleOutliers}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Remove outliers (&gt;2 SD)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDataPoints}
                    onChange={onToggleDataPoints}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Show data points
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Display type</label>
              <div className="flex flex-wrap gap-2">
                {(['errorbars', 'datapoints', 'whiskers'] as DisplayMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={displayMode === mode ? 'default' : 'secondary'}
                    onClick={() => onDisplayModeChange(mode)}
                  >
                    {mode === 'errorbars' ? 'Error bars' : mode === 'datapoints' ? 'Data points' : 'Box plot'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="m-0 text-lg font-light">{dependentVariable}</h2>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <ExplainBehavior mode={displayMode} />
          </div>
          <div className="h-80 w-full rounded-md border border-gray-100 bg-white">
            {dataToPlot.length > 0 ? (
              <Plot data={dataToPlot} layout={layout} useResizeHandler style={{ width: '100%', height: '100%' }} />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-muted">Select at least one behavioral dataset to see the plot.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="m-0 text-lg font-light">Export aggregated data</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="m-0 text-ink-muted">
            Save a summary CSV with one row per dataset and columns for each condition.
          </p>
          <div className="flex items-center gap-3">
            <Button disabled={selectedDatasets.length === 0} size="lg" onClick={onExport}>
              Download aggregated data
            </Button>
            {exportStatus === 'success' && (
              <span className="text-sm text-brand">Saved successfully.</span>
            )}
            {exportStatus === 'error' && (
              <span className="text-sm text-red-600">Export failed — try again.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
