import { configureStore, Action } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import { createLogger } from 'redux-logger';
import { ThunkAction } from 'redux-thunk';
import rootReducer from './reducers';
import rootEpic from './epics';

export type RootState = ReturnType<typeof rootReducer>;

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
        epicMiddleware
      );
      if (shouldIncludeLogger) {
        const logger = createLogger({ level: 'info', collapsed: true });
        return base.concat(logger) as unknown as typeof base;
      }
      return base;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preloadedState: initialState as any, // configureStore preloadedState typing requires any cast with partial state
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  epicMiddleware.run(rootEpic as any); // mixed action types across combined epics require any
  return store;
};

export type Store = ReturnType<typeof configuredStore>;
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;
