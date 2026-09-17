import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SecondaryNavComponent from '.';

describe('SecondaryNavComponent experiment settings', () => {
  it('shows EEG status and exposes a persistent EEG switch', async () => {
    const onEEGEnabledChange = vi.fn();

    render(
      <MemoryRouter>
        <SecondaryNavComponent
          title="Experiment Design"
          steps={{ OVERVIEW: 'OVERVIEW' }}
          activeStep="OVERVIEW"
          onStepClick={vi.fn()}
          isEEGEnabled
          onEEGEnabledChange={onEEGEnabledChange}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('EEG ON')).toBeVisible();
    const menu = screen.getByRole('button', { name: 'Settings' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    const checkbox = await screen.findByRole('checkbox', {
      name: 'EEG recording',
    });
    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(onEEGEnabledChange).toHaveBeenCalledWith(false);
  });
});
