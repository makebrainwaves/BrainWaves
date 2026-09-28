import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PreviewButton from '../PreviewButtonComponent';

describe('PreviewButton', () => {
  it('shows the one shared preview label while previewing', () => {
    render(<PreviewButton isPreviewing onClick={vi.fn()} />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText(/not recording/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Stop preview' })
    ).toBeInTheDocument();
  });

  it('offers Run & record once a preview has run', () => {
    const onRun = vi.fn();
    const { rerender } = render(
      <PreviewButton
        isPreviewing={false}
        onClick={vi.fn()}
        onRunAndRecord={onRun}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Run & record' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Preview experiment' }));
    rerender(
      <PreviewButton isPreviewing onClick={vi.fn()} onRunAndRecord={onRun} />
    );
    rerender(
      <PreviewButton
        isPreviewing={false}
        onClick={vi.fn()}
        onRunAndRecord={onRun}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Run & record' }));
    expect(onRun).toHaveBeenCalled();
  });
});
