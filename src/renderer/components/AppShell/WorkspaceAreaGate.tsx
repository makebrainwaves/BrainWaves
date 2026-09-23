import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { AREA_ROUTES } from './areas';
import BlockedAreaEmptyState from './BlockedAreaEmptyState';
import { Area } from './types';
import { useWorkspaceProgress } from './useWorkspaceProgress';

interface Props {
  area: Extract<Area, 'clean' | 'analyze'>;
  children: ReactNode;
}

const COPY: Record<Props['area'], [title: string, body: string]> = {
  clean: [
    'Nothing to clean yet',
    'Clean needs at least one complete EEG recording. Collect a run first, then come back.',
  ],
  analyze: [
    'No results yet',
    'Analyze needs data from a run. Collect a recording first, then come back.',
  ],
};

/**
 * Keeps a workflow area selectable but replaces its screen with an
 * explanation and one corrective action when the workspace has no data
 * for it. Renders nothing until file counts have been read, so the wrong
 * screen never flashes first.
 */
export default function WorkspaceAreaGate({ area, children }: Props) {
  const experiment = useSelector((state: RootState) => state.experiment);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const modality = experiment.isEEGEnabled ? 'eeg' : 'behavior';
  const { counts } = useWorkspaceProgress(experiment.title, modality, pathname);

  if (counts === null) return null;

  const blocked =
    area === 'clean'
      ? counts.raw === 0
      : counts.raw === 0 && counts.cleaned === 0 && counts.behavior === 0;

  if (!blocked) return <>{children}</>;

  const [title, body] = COPY[area];
  return (
    <BlockedAreaEmptyState
      title={title}
      body={body}
      onCollect={() => navigate(AREA_ROUTES.collect)}
    />
  );
}
