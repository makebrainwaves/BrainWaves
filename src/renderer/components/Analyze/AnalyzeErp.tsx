import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { SCREENS } from '../../constants/constants';
import PyodidePlotWidget from '../PyodidePlotWidget';
import ClickableHeadDiagramSVG from '../svgs/ClickableHeadDiagramSVG';
import { cssColorForIndex } from '../../utils/eeg/conditionPalette';
import type { EegDatasetOption, EpochInfoRow, ConditionSummary } from './fixtures';

export type ErpStatus = 'results' | 'noData' | 'loading' | 'error';

export interface AnalyzeErpProps {
  status: ErpStatus;
  title: string;
  /** True when cleaned EEG exists and the ERP plot can be requested. */
  eegAvailable: boolean;
  eegDatasets: EegDatasetOption[];
  channelInfo: string[];
  erpPlot: { [key: string]: string } | null;
  selectedChannel: string;
  epochsInfo: EpochInfoRow[];
  conditions: ConditionSummary[];
  onChannelSelect: (channel: string) => void;
  onRequestErp: () => void;
}

function ExplainErp() {
  return (
    <div className="max-w-[640px] space-y-3 text-ink-muted">
      <p className="m-0">
        An ERP (event-related potential) is the brain response that lines up with a specific event —
        like seeing a face or a house.
      </p>
      <p className="m-0">
        We average many trials together so the brain signal stands out from random noise. A positive
        or negative peak at a particular time tells you when the brain differentiated one condition
        from another.
      </p>
    </div>
  );
}

export default function AnalyzeErp({
  status,
  title,
  eegAvailable,
  eegDatasets,
  channelInfo,
  erpPlot,
  selectedChannel,
  epochsInfo,
  conditions,
  onChannelSelect,
  onRequestErp,
}: AnalyzeErpProps) {
  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <Spinner size={40} aria-hidden />
        <h1 className="m-0">Computing ERP…</h1>
        <p className="m-0 max-w-[560px] text-ink-muted">Averaging trials and bootstrapping confidence intervals for the selected channel.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <h1 className="m-0">ERP analysis failed</h1>
        <p className="m-0 max-w-[560px] text-ink-muted">The worker could not compute the ERP. Try another channel or check the cleaned dataset.</p>
        <Button size="lg" onClick={onRequestErp}>Try again</Button>
      </div>
    );
  }

  if (!eegAvailable) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <h1 className="m-0">ERP needs cleaned EEG</h1>
        <p className="m-0 max-w-[560px] text-ink-muted">
          You need at least one cleaned EEG dataset before you can look at brain responses. Clean your
          recordings first.
        </p>
        <Button asChild size="lg">
          <Link to={SCREENS.CLEAN.route}>Go to Clean →</Link>
        </Button>
      </div>
    );
  }

  if (status === 'noData' || !erpPlot) {
    return (
      <div className="flex h-full flex-col gap-6">
        <section>
          <h1 className="m-0 mb-1">ERP</h1>
          <ExplainErp />
        </section>
        <Card>
          <CardContent className="pt-5">
            <p className="m-0 text-ink-muted">Select a channel to compute and view the ERP.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5 lg:flex-row">
      <div className="flex-1">
        <section className="mb-4">
          <h1 className="m-0 mb-1">ERP</h1>
          <ExplainErp />
        </section>
        <Card>
          <CardHeader>
            <h2 className="m-0 text-xl font-light">
              Channel: <span className="font-medium text-ink">{selectedChannel}</span>
            </h2>
          </CardHeader>
          <CardContent>
            <PyodidePlotWidget title={title} imageTitle="erp" plotMIMEBundle={erpPlot} />
          </CardContent>
        </Card>
        {epochsInfo.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink-muted">
            {epochsInfo
              .filter((row) => row.name !== 'Drop Percentage' && row.name !== 'Total Epochs')
              .map((row, i) => (
                <span key={String(row.name)} className="rounded-full bg-[#f0f0f0] px-2 py-0.5">
                  <span style={{ color: cssColorForIndex(i) }}>●</span> {row.name}: {row.value}
                </span>
              ))}
          </div>
        )}
      </div>

      <Card className="w-full shrink-0 lg:w-64">
        <CardHeader>
          <h2 className="m-0 text-lg font-light">Select a channel</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div style={{ minHeight: 250, minWidth: 250, maxWidth: '100%' }}>
            <ClickableHeadDiagramSVG channelinfo={channelInfo} onChannelClick={onChannelSelect} />
          </div>
          <div className="space-y-1">
            {channelInfo.map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => onChannelSelect(channel)}
                className={`w-full rounded px-2 py-1 text-left text-sm transition-colors ${
                  selectedChannel === channel
                    ? 'bg-brand text-white'
                    : 'text-ink hover:bg-brand-light'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
          {conditions.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Conditions</p>
              <ul className="space-y-1 text-sm">
                {conditions.map((cond) => (
                  <li key={cond.code} className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: cond.color }} aria-hidden />
                    <span>{cond.label}</span>
                    <span className="ml-auto text-xs text-ink-muted">{cond.count} trials</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
