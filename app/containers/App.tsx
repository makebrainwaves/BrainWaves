import * as React from 'react';
import { ToastContainer } from 'react-toastify';
import TopNav from './TopNavBarContainer';

type Props = {
  children: React.ReactNode;
};

export interface IAppProps {
}


export default function App(props: Props) {
    return (
      <div>
        <TopNav />
        {props.children}
        <ToastContainer  />
      </div>
    );
  }
}
