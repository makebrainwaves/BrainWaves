import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CustomPredictionCard from '../CustomPredictionCard';
import { mergeCustomParams } from '../../../experiments/custom/params';

const params = mergeCustomParams({
  description: { hypothesis: 'Cats are harder to tell apart.' },
  stimulus1: { title: 'Cats' },
  stimulus2: { title: 'Dogs' },
  stimulus3: { title: 'Birds' },
});

describe('CustomPredictionCard', () => {
  it('words its answers from the student’s conditions and saves the pick', () => {
    const onChange = vi.fn();
    render(
      <CustomPredictionCard params={params} isEEGEnabled onChange={onChange} />
    );
    expect(
      screen
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')!.textContent)
    ).toEqual([
      'Cats slower than Dogs',
      'Cats and Dogs about the same speed',
      'Dogs slower than Cats',
    ]);

    fireEvent.change(screen.getByLabelText('with'), {
      target: { value: 'Birds' },
    });
    fireEvent.change(screen.getByLabelText('on'), {
      target: { value: 'accuracy' },
    });
    fireEvent.click(
      screen.getByRole('radio', { name: 'Birds more accurate than Cats' })
    );

    expect(onChange).toHaveBeenCalledWith({
      conditions: ['Cats', 'Birds'],
      measure: 'accuracy',
      direction: 'a<b',
    });
    expect(screen.getByText(/Cats are harder/)).toBeInTheDocument();
  });

  it('offers the brain response only when EEG is on', () => {
    render(
      <CustomPredictionCard
        params={params}
        isEEGEnabled={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('option', { name: /Brain response/ })).toBeNull();
  });

  it('flags a prediction whose condition was renamed, and shows nothing as picked', () => {
    render(
      <CustomPredictionCard
        params={{
          ...params,
          prediction: {
            conditions: ['Cats', 'Hamsters'],
            measure: 'rt',
            direction: 'a>b',
          },
        }}
        isEEGEnabled
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('needs an update');
    expect(screen.queryByRole('radio', { checked: true })).toBeNull();
    expect(screen.getByLabelText('with')).toHaveValue('Dogs');
  });
});
