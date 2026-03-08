import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configuredStore } from '../src/renderer/store';

// Stub heavy dependencies that aren't needed for routing tests
vi.mock('../src/renderer/containers/TopNavBarContainer', () => ({
  default: () => null,
}));

vi.mock('../src/renderer/components/RouteChangeTracker', () => ({
  default: () => null,
}));

// Lightweight stand-ins for the screen components
vi.mock('../src/renderer/containers/HomeContainer', () => ({
  default: () => <div data-testid="home-screen">Home</div>,
}));

vi.mock('../src/renderer/containers/ExperimentDesignContainer', () => ({
  default: () => <div data-testid="design-screen">Design</div>,
}));

vi.mock('../src/renderer/containers/CollectContainer', () => ({
  default: () => <div data-testid="collect-screen">Collect</div>,
}));

vi.mock('../src/renderer/containers/CleanContainer', () => ({
  default: () => <div data-testid="clean-screen">Clean</div>,
}));

vi.mock('../src/renderer/containers/AnalyzeContainer', () => ({
  default: () => <div data-testid="analyze-screen">Analyze</div>,
}));

// Import after mocks
const AppRoutes = (await import('../src/renderer/routes')).default;

function renderWithRouter(initialPath: string) {
  const store = configuredStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>
  );
}

describe('Routing', () => {
  it('renders Home screen at /', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('home-screen')).toBeDefined();
  });

  it('renders Design screen at /design', () => {
    renderWithRouter('/design');
    expect(screen.getByTestId('design-screen')).toBeDefined();
  });

  it('renders Collect screen at /collect', () => {
    renderWithRouter('/collect');
    expect(screen.getByTestId('collect-screen')).toBeDefined();
  });
});
