import { configureStore, Action } from '@reduxjs/toolkit';
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

// Redux Observable (Epic) Middleware
const epicMiddleware = createEpicMiddleware();

const excludeLoggerEnvs = ['test', 'production'];
const shouldIncludeLogger = !excludeLoggerEnvs.includes(
  import.meta.env.MODE || ''
);

export const configuredStore = (initialState?: RootState) => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => {
      const base = getDefaultMiddleware({ serializableCheck: false }).concat(
        router,
        epicMiddleware
      );
      if (shouldIncludeLogger) {
        const logger = createLogger({ level: 'info', collapsed: true });
        return base.concat(logger);
      }
      return base;
    },
    preloadedState: initialState,
  });

  epicMiddleware.run(rootEpic);
  return store;
};

export type Store = ReturnType<typeof configuredStore>;
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;
