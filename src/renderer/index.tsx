import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './containers/Root';
import { configuredStore } from './store';
import './app.global.css';

const store = configuredStore();

// Expose store for playtest agents to check worker readiness via CDP.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__STORE__ = store;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <Root store={store} />
);
