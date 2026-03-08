import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

function HelloBrainWaves() {
  return <div>Hello, BrainWaves!</div>;
}

describe('App sanity check', () => {
  it('renders a simple component', () => {
    render(<HelloBrainWaves />);
    expect(screen.getByText('Hello, BrainWaves!')).toBeDefined();
  });
});
