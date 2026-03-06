import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { History } from 'history';

const Router = ConnectedRouter as React.ComponentType<{
  history: History;
  children?: React.ReactNode;
}>;
import { Store } from '../reducers/types';
import Routes from '../routes';
import { RootState } from '../reducers';

interface Props {
  store: Store<RootState>;
  history: History;
}

const Root = ({ store, history }: Props) => (
  <Provider store={store}>
    <Router history={history}>
      <Routes />
    </Router>
  </Provider>
);

export default Root;
