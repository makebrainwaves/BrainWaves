import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Analyze from '../AnalyzeComponent';
import { EXPERIMENTS } from '../../constants/constants';
import type {
  ExperimentParameters,
  Prediction,
} from '../../constants/interfaces';
import { params as stroopParams } from '../../experiments/stroop/params';
import { params as facesParams } from '../../experiments/faces_houses/params';
import { ExperimentActions, PyodideActions } from '../../actions';

vi.mock('lab.js', () => ({}));
vi.mock('plotly.js-cartesian-dist', () => ({
  default: { react: vi.fn(), purge: vi.fn() },
}));
vi.mock('../../utils/filesystem/storage', () => ({
  readWorkspaceCleanedEEGData: async () => [
    { name: 'P1-1-Clean-epo.fif', path: '/w/P1-1-Clean-epo.fif' },
  ],
  readWorkspaceBehaviorData: async () => [],
  readBehaviorData: async () => [],
  storeAggregatedBehaviorData: vi.fn(),
  getSubjectNamesFromFiles: (paths: string[]) => paths,
}));

const renderAnalyze = async (
  type: EXPERIMENTS,
  params: ExperimentParameters
) => {
  const navigate = vi.fn();
  await act(async () => {
    render(
      <Analyze
        title="zz_test"
        type={type}
        isEEGEnabled
        params={params}
        epochsInfo={[]}
        channelInfo={['TP9']}
        psdPlot={null}
        topoPlot={null}
        erpPlot={null}
        cleanedEpochArrays={null}
        failedPlots={[]}
        ExperimentActions={ExperimentActions}
        PyodideActions={PyodideActions}
        navigate={navigate}
      />
    );
  });
  return navigate;
};

const openTab = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('Analyze — your prediction', () => {
  it('shows a response-time prediction on Behavior, not on ERP', async () => {
    const prediction: Prediction = {
      conditions: ['Mismatch', 'Match'],
      measure: 'rt',
      direction: 'a>b',
    };
    await renderAnalyze(EXPERIMENTS.STROOP, { ...stroopParams, prediction });

    openTab('BEHAVIOR');
    expect(screen.getByText('Mismatch slower than Match')).toBeVisible();
    expect(screen.getByText('What to look for')).toBeInTheDocument();

    openTab('ERP');
    expect(screen.queryByText('Your prediction')).toBeNull();
  });

  it('shows a brain-response prediction on ERP, not on Behavior', async () => {
    const prediction: Prediction = {
      conditions: ['Face', 'House'],
      measure: 'erp',
      direction: 'a<b',
    };
    await renderAnalyze(EXPERIMENTS.N170, { ...facesParams, prediction });

    openTab('ERP');
    expect(
      screen.getByText('Face dips lower than House around 170 ms')
    ).toBeInTheDocument();

    openTab('BEHAVIOR');
    expect(screen.queryByText('Your prediction')).toBeNull();
  });

  it('without a prediction, points back to Prepare', async () => {
    const navigate = await renderAnalyze(EXPERIMENTS.STROOP, stroopParams);

    openTab('BEHAVIOR');
    fireEvent.click(screen.getByRole('button', { name: 'add one in Prepare' }));

    expect(navigate).toHaveBeenCalledWith('/design');
  });

  it('says nothing about predictions for an imported study', async () => {
    await renderAnalyze(EXPERIMENTS.IMPORTED, {
      ...stroopParams,
      imported: {
        kind: 'jspsych',
        name: 'study.js',
        file: '/study.js',
        conditionKey: '',
        correctKey: '',
        conditionLabels: [],
      },
    } as ExperimentParameters);

    openTab('BEHAVIOR');
    expect(screen.queryByText('Your prediction')).toBeNull();
  });
});
