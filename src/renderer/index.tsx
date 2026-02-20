import React from 'react';
import { render } from 'react-dom';
import Root from './containers/Root';
import { configuredStore, history } from './store';
import './app.global.css';

const store = configuredStore();

render(
  <Root store={store} history={history} />,
  document.getElementById('root')
);
