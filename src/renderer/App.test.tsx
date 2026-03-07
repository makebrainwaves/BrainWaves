import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

function HelloWorld() {
  return <div data-testid="hello">Hello, BrainWaves!</div>;
}

describe('sanity check', () => {
  it('renders a basic component', () => {
    render(<HelloWorld />);
    expect(screen.getByTestId('hello')).toBeInTheDocument();
  });
});
