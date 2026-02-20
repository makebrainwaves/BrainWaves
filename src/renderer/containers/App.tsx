import * as React from 'react';
import { ToastContainer } from 'react-toastify';
import TopNav from './TopNavBarContainer';

type Props = {
  children: React.ReactNode;
};

export function App(props: Props) {
  return (
    <div>
      <TopNav />
      {props.children}
      <ToastContainer />
    </div>
  );
}
