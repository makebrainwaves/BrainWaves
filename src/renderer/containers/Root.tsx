import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { History } from 'history';
import { Store } from '../reducers/types';
import Routes from '../routes';
import { RootState } from '../reducers';

interface Props {
  store: Store<RootState>;
  history: History;
}

const Root = ({ store, history }: Props) => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Routes />
    </ConnectedRouter>
  </Provider>
);

export default Root;
