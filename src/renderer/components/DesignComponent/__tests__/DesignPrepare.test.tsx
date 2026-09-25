import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Design, { DesignProps } from '../index';
import { EXPERIMENTS } from '../../../constants/constants';

vi.mock('lab.js', () => ({}));
vi.mock('../../../utils/filesystem/storage', () => ({
  readWorkspaces: () => Promise.resolve([]),
}));
vi.mock('../CustomDesignComponent', () => ({
  default: () => <div data-testid="custom-design" />,
}));
vi.mock('../ImportedDesignComponent', () => ({
  default: () => <div data-testid="imported-design" />,
}));
vi.mock('../../PreviewExperimentComponent', () => ({
  default: () => <div data-testid="preview-experiment" />,
}));

const baseProps = {
  navigate: vi.fn(),
  type: EXPERIMENTS.N170,
  title: 'Faces_Houses_1',
  params: {},
  experimentObject: {},
  ExperimentActions: {
    SetEEGEnabled: vi.fn(),
    SaveWorkspace: vi.fn(),
    CreateNewWorkspace: vi.fn(),
  },
  isEEGEnabled: true,
} as unknown as DesignProps;

describe('Design — built-in Prepare', () => {
  it('renders the Prepare steps with the experiment keys and the real trial counts', () => {
    render(<Design {...baseProps} />);
    expect(
      screen.getByRole('navigation', { name: 'Prepare steps' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Next: Background/ })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Protocol/ }));
    expect(screen.getByText('Face')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('6').parentElement).toHaveTextContent(
      '6 practice trials'
    );
    expect(screen.getByText('120').parentElement).toHaveTextContent(
      '120 recorded trials'
    );
  });

  it('walks Overview → Background → Protocol → Preview and offers Try the experiment', () => {
    render(<Design {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Next: Background/ }));
    expect(screen.getByText(/BACKGROUND/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next: Protocol/ }));
    expect(screen.getByText('WHAT HAPPENS IN THIS TASK')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try the experiment/ }));
    expect(screen.queryByTestId('preview-experiment')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try the experiment/ }));
    expect(screen.getByTestId('preview-experiment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop preview' }));
    fireEvent.click(screen.getByRole('button', { name: /Run & record/ }));
    expect(baseProps.navigate).toHaveBeenCalledWith('/collect');
  });

  it('keeps the EEG toggle, saving the workspace choice', () => {
    render(<Design {...baseProps} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'EEG recording' }));
    expect(baseProps.ExperimentActions.SetEEGEnabled).toHaveBeenCalledWith(
      false
    );
    expect(baseProps.ExperimentActions.SaveWorkspace).toHaveBeenCalled();
  });

  it('keeps Custom on its authoring flow', () => {
    render(<Design {...baseProps} type={EXPERIMENTS.CUSTOM} />);
    expect(screen.getByTestId('custom-design')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Prepare steps' })
    ).not.toBeInTheDocument();
  });

  it('keeps Imported on its authoring flow', () => {
    render(<Design {...baseProps} type={EXPERIMENTS.IMPORTED} />);
    expect(screen.getByTestId('imported-design')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Prepare steps' })
    ).not.toBeInTheDocument();
  });
});
