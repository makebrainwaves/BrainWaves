import { Dispatch as ReduxDispatch, Store as ReduxStore, Action } from 'redux';

export type GetState<T> = () => T;

export type Dispatch = ReduxDispatch<Action<string>>;

export type Store<T> = ReduxStore<T, Action<string>>;
