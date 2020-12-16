import { configureStore, getDefaultMiddleware, Action } from '@reduxjs/toolkit';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import { createEpicMiddleware } from 'redux-observable';
import { createLogger } from 'redux-logger';
import { ThunkAction } from 'redux-thunk';
import createRootReducer from './reducers';
import rootEpic from './epics';

export const history = createHashHistory();
const rootReducer = createRootReducer(history);

export type RootState = ReturnType<typeof rootReducer>;

const router = routerMiddleware(history);
const middleware = [
  ...getDefaultMiddleware({ serializableCheck: false }),
  router,
];

// Redux Observable (Epic) Middleware
const epicMiddleware = createEpicMiddleware();
middleware.push(epicMiddleware);

const excludeLoggerEnvs = ['test', 'production'];
const shouldIncludeLogger = !excludeLoggerEnvs.includes(
  process.env.NODE_ENV || ''
);

if (shouldIncludeLogger) {
  const logger = createLogger({
    level: 'info',
    collapsed: true,
  });
  middleware.push(logger);
}

export const configuredStore = (initialState?: RootState) => {
  // Create Store
  const store = configureStore({
    reducer: rootReducer,
    middleware,
    preloadedState: initialState,
  });

  if (process.env.NODE_ENV === 'development' && module.hot) {
    module.hot.accept(
      './reducers',
      // eslint-disable-next-line global-require
      () => store.replaceReducer(require('./reducers').default)
    );
  }

  epicMiddleware.run(rootEpic);
  return store;
};

export type Store = ReturnType<typeof configuredStore>;
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;
