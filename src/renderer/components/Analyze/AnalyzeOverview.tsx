import React from 'react';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import { getSubjectNamesFromFiles } from '../../utils/filesystem/storage';
import {
  AnalyzeLayout,
  EPOCH_TOTAL_ROWS,
  CleanRequired,
  DatasetChecklist,
  PlotFigure,
  RailSection,
  ResultStatus,
  railLabel,
} from './AnalyzeParts';
import type { DatasetOption, EpochInfoRow } from './fixtures';

export interface AnalyzeOverviewProps {
  /** Result of loading the selected datasets and plotting PSD + topography. */
  status: 'results' | 'loading' | 'error';
  /** False until the workspace has at least one cleaned recording. */
  eegAvailable: boolean;
  workspaceTitle: string;
  eegDatasets: DatasetOption[];
  selectedDatasets: string[];
  /** `pyodide.epochsInfo` for the loaded selection. */
  epochsInfo: EpochInfoRow[];
  psdPlot: { [key: string]: string } | null;
  topoPlot: { [key: string]: string } | null;
  /** `rail` (controls left) or `plotsFirst` (plots on top, datasets strip below). */
  arrangement?: 'rail' | 'plotsFirst';
  onDatasetChange(values: string[]): void;
  onRetry(): void;
  onGoToClean(): void;
}

/** Who and what is in the loaded selection: participants, trials per condition, trials removed. */
function IncludedSummary({
  selectedDatasets,
  epochsInfo,
  inline,
}: {
  selectedDatasets: string[];
  epochsInfo: EpochInfoRow[];
  inline?: boolean;
}) {
  const participants = getSubjectNamesFromFiles(selectedDatasets);
  const conditions = epochsInfo.filter((row) => !EPOCH_TOTAL_ROWS[row.name]);
  const dropped = epochsInfo.find((row) => row.name === 'Drop Percentage');
  return (
    <div
      className={
        inline
          ? 'flex flex-wrap items-center gap-x-[18px] gap-y-[4px] text-[14px] text-ink'
          : 'flex flex-col gap-[6px] text-[14px] text-ink'
      }
    >
      <span>
        {participants.length} participant
        {participants.length === 1 ? '' : 's'}: {participants.join(', ')}
      </span>
      {conditions.map((row, i) => (
        <span key={row.name} className="flex items-center gap-[8px]">
          <span
            aria-hidden
            className="h-[10px] w-[10px] rounded-full"
            style={{ backgroundColor: cssColorForIndex(i) }}
          />
          {row.name}: {row.value} trials
        </span>
      ))}
      {dropped && (
        <span className="text-ink-muted">
          {dropped.value}% of trials left out in cleaning
        </span>
      )}
    </div>
  );
}

/**
 * Overview tab: choose cleaned recordings, see who is included, and read the
 * PSD and per-sensor ERPs side by side. Pure props.
 */
export default function AnalyzeOverview({
  status,
  eegAvailable,
  workspaceTitle,
  eegDatasets,
  selectedDatasets,
  epochsInfo,
  psdPlot,
  topoPlot,
  arrangement = 'rail',
  onDatasetChange,
  onRetry,
  onGoToClean,
}: AnalyzeOverviewProps) {
  if (!eegAvailable) {
    return <CleanRequired analysis="Overview" onGoToClean={onGoToClean} />;
  }

  const results =
    selectedDatasets.length === 0 ? (
      <ResultStatus
        status="empty"
        title="Pick a recording to start"
        body="Tick one or more cleaned recordings. Picking several averages them together."
      />
    ) : status === 'loading' ? (
      <ResultStatus
        status="loading"
        title="Building your overview…"
        body="Averaging the chosen recordings and drawing both plots. This can take a few seconds."
      />
    ) : status === 'error' ? (
      <ResultStatus
        status="error"
        title="The overview didn’t load"
        body="Something went wrong while analyzing these recordings. Try again, or choose a different recording."
        onRetry={onRetry}
      />
    ) : (
      <div className="flex min-h-0 flex-1 gap-[14px]">
        {psdPlot && (
          <PlotFigure
            heading="Power at each frequency"
            caption="How strong each brain rhythm is, from slow (left) to fast (right)."
            workspaceTitle={workspaceTitle}
            imageTitle="psd"
            plot={psdPlot}
          />
        )}
        {topoPlot && (
          <PlotFigure
            heading="ERPs across the scalp"
            caption="The average response to each image type, drawn at every sensor’s place on the head."
            workspaceTitle={workspaceTitle}
            imageTitle="topo"
            plot={topoPlot}
          />
        )}
      </div>
    );

  if (arrangement === 'plotsFirst') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-[14px] px-[24px] py-[20px]">
        <h1 className="sr-only">Overview</h1>
        {results}
        <aside
          aria-label="Analysis controls"
          className="flex flex-none items-center gap-[24px] rounded-lg border border-gray-200 bg-white px-[16px] py-[12px]"
        >
          <div className="flex flex-none flex-col gap-[6px]">
            <h2 className={`m-0 ${railLabel}`}>Cleaned recordings</h2>
            <DatasetChecklist
              inline
              options={eegDatasets}
              selected={selectedDatasets}
              onChange={onDatasetChange}
            />
          </div>
          {selectedDatasets.length > 0 && status === 'results' && (
            <div className="flex min-w-0 flex-col gap-[6px] border-l border-gray-200 pl-[24px]">
              <h2 className={`m-0 ${railLabel}`}>Included</h2>
              <IncludedSummary
                inline
                selectedDatasets={selectedDatasets}
                epochsInfo={epochsInfo}
              />
            </div>
          )}
        </aside>
      </div>
    );
  }

  return (
    <AnalyzeLayout
      title="Overview"
      rail={
        <>
          <RailSection label="Cleaned recordings">
            <DatasetChecklist
              options={eegDatasets}
              selected={selectedDatasets}
              onChange={onDatasetChange}
            />
          </RailSection>
          {selectedDatasets.length > 0 && status === 'results' && (
            <RailSection
              label="Included"
              className="border-t border-gray-200 pt-[12px]"
            >
              <IncludedSummary
                selectedDatasets={selectedDatasets}
                epochsInfo={epochsInfo}
              />
            </RailSection>
          )}
        </>
      }
    >
      {results}
    </AnalyzeLayout>
  );
}
