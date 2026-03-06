import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './containers/Root';
import { configuredStore, history } from './store';
import './app.global.css';

const store = configuredStore();

createRoot(document.getElementById('root') as HTMLElement).render(
  <Root store={store} history={history} />
);
