import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Observable } from 'rxjs';
import ViewerComponent from './ViewerComponent';

describe('ViewerComponent', () => {
  it('renders a webview element with the correct src after getViewerUrl resolves', async () => {
    window.electronAPI = {
      ...window.electronAPI,
      getViewerUrl: async () => 'http://viewer.local/',
    };

    const { container } = render(
      <ViewerComponent
        plottingInterval={500}
        signalQualityObservable={undefined as unknown as Observable<never>}
      />
    );

    // componentDidMount calls getViewerUrl (async). The promise resolves and
    // setState is called. Wait for the microtask + re-render to settle.
    await act(async () => {});

    const webview = container.querySelector('webview');
    expect(webview).not.toBeNull();
    expect(webview?.getAttribute('src')).toBe('http://viewer.local/');
  });
});