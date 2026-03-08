import * as React from 'react';
import { ToastContainer } from 'react-toastify';
import TopNav from './TopNavBarContainer';
import RouteChangeTracker from '../components/RouteChangeTracker';

type Props = {
  children: React.ReactNode;
};

export function App(props: Props) {
  return (
    <div>
      <RouteChangeTracker />
      <TopNav />
      {props.children}
      <ToastContainer />
    </div>
  );
}
