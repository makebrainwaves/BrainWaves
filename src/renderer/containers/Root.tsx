import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { Store } from '../reducers/types';
import Routes from '../routes';
import { RootState } from '../reducers';

interface Props {
  store: Store<RootState>;
}

const Root = ({ store }: Props) => (
  <Provider store={store}>
    <HashRouter>
      <Routes />
    </HashRouter>
  </Provider>
);

export default Root;
