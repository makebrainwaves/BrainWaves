import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { SCREENS } from '../../constants/constants';
import PyodidePlotWidget from '../PyodidePlotWidget';
import type { EegDatasetOption, EpochInfoRow } from './fixtures';

export type OverviewStatus = 'results' | 'loading' | 'error';

export interface AnalyzeOverviewProps {
  status: OverviewStatus;
  title: string;
  eegDatasets: EegDatasetOption[];
  selectedDatasets: string[];
  epochsInfo: EpochInfoRow[];
  psdPlot: { [key: string]: string } | null;
  topoPlot: { [key: string]: string } | null;
  onDatasetChange: (values: string[]) => void;
}

function SelectedSummary({ selectedDatasets, epochsInfo }: { selectedDatasets: string[]; epochsInfo: EpochInfoRow[] }) {
  if (selectedDatasets.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 text-sm text-ink-muted">
      <span>{selectedDatasets.length} dataset{selectedDatasets.length === 1 ? '' : 's'} selected</span>
      {epochsInfo
        .filter((row) => row.name !== 'Drop Percentage' && row.name !== 'Total Epochs')
        .map((row) => (
          <span key={row.name} className="rounded-full bg-[#f0f0f0] px-2 py-0.5">
            {row.name}: {row.value}
          </span>
        ))}
    </div>
  );
}

export default function AnalyzeOverview({
  status,
  title,
  eegDatasets,
  selectedDatasets,
  epochsInfo,
  psdPlot,
  topoPlot,
  onDatasetChange,
}: AnalyzeOverviewProps) {
  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <Spinner size={40} aria-hidden />
        <h1 className="m-0">Loading overview…</h1>
        <p className="m-0 max-w-[560px] text-ink-muted">This may take a few moments while the averaged PSD and topography are computed.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <h1 className="m-0">Couldn’t build the overview</h1>
        <p className="m-0 max-w-[560px] text-ink-muted">The analysis worker returned an error. Try a different dataset or clean the recording again.</p>
        <Button size="lg">Try again</Button>
      </div>
    );
  }

  const hasDatasets = eegDatasets.some((ds) => ds.key !== '');

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="m-0 mb-1">Overview</h1>
        <p className="m-0 mb-4 max-w-[720px] text-ink-muted">
          Get a bird&apos;s-eye view of your cleaned EEG. Select one or more datasets to see averaged power and topography.
        </p>
        {hasDatasets ? (
          <Card>
            <CardHeader className="pb-0">
              <h2 className="m-0 text-xl font-light">Cleaned EEG datasets</h2>
            </CardHeader>
            <CardContent>
              <select
                multiple
                className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white p-2 text-sm"
                value={selectedDatasets}
                onChange={(e) => onDatasetChange(Array.from(e.target.selectedOptions, (o) => o.value))}
              >
                {eegDatasets.map((ds) => (
                  <option key={ds.key} value={ds.value}>
                    {ds.text}
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <SelectedSummary selectedDatasets={selectedDatasets} epochsInfo={epochsInfo} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-5">
              <p className="m-0 mb-4 text-ink-muted">
                No cleaned EEG yet. Clean a recording first, then it will show up here to analyze.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link to={SCREENS.CLEAN.route}>Go to Clean →</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {hasDatasets && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {psdPlot ? (
            <Card>
              <CardHeader>
                <h2 className="m-0 text-xl font-light">Power by frequency</h2>
              </CardHeader>
              <CardContent>
                <PyodidePlotWidget title={title} imageTitle="psd" plotMIMEBundle={psdPlot} />
              </CardContent>
            </Card>
          ) : null}
          {topoPlot ? (
            <Card>
              <CardHeader>
                <h2 className="m-0 text-xl font-light">Voltage across the scalp</h2>
              </CardHeader>
              <CardContent>
                <PyodidePlotWidget title={title} imageTitle="topo" plotMIMEBundle={topoPlot} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
