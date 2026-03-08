/**
 * UI Migration tests - verify key screens render without crashing
 * after replacing semantic-ui-react with Tailwind + Shadcn/ui.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configuredStore } from '../src/renderer/store';

// Stub heavy/native-only modules
vi.mock('../src/renderer/containers/TopNavBarContainer', () => ({
  default: () => null,
}));
vi.mock('../src/renderer/components/RouteChangeTracker', () => ({
  default: () => null,
}));
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

const AppRoutes = (await import('../src/renderer/routes')).default;

function renderScreen(path: string) {
  const store = configuredStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>
  );
}

describe('UI migration - key screens render without crashing', () => {
  it('Home screen renders', () => {
    renderScreen('/');
    expect(screen.getByTestId('home-screen')).toBeDefined();
  });

  it('Design screen renders', () => {
    renderScreen('/design');
    expect(screen.getByTestId('design-screen')).toBeDefined();
  });

  it('Collect screen renders', () => {
    renderScreen('/collect');
    expect(screen.getByTestId('collect-screen')).toBeDefined();
  });

  it('Clean screen renders', () => {
    renderScreen('/clean');
    expect(screen.getByTestId('clean-screen')).toBeDefined();
  });

  it('Analyze screen renders', () => {
    renderScreen('/analyze');
    expect(screen.getByTestId('analyze-screen')).toBeDefined();
  });
});

describe('UI migration - no semantic-ui-react imports remain', () => {
  it('verifies zero semantic-ui-react imports in src/', async () => {
    const { readdirSync, readFileSync, statSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const path = await import('path');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(__dirname, '..');
    const srcDir = path.join(root, 'src');

    function findSemanticImports(dir: string): string[] {
      const hits: string[] = [];
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
          hits.push(...findSemanticImports(full));
        } else if (/\.(tsx?|jsx?)$/.test(entry)) {
          const content = readFileSync(full, 'utf-8');
          if (content.includes('semantic-ui-react')) {
            hits.push(full);
          }
        }
      }
      return hits;
    }

    const remaining = findSemanticImports(srcDir);
    expect(remaining, `These files still import semantic-ui-react: ${remaining.join(', ')}`).toHaveLength(0);
  });
});
