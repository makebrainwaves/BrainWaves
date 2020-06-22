// @flow
import * as React from 'react';
import { ToastContainer } from 'react-toastify';
import TopNav from './TopNavBarContainer';

type Props = {
  children: React.Node
};

export default class App extends React.Component<Props> {
  // props: Props;

  render() {
    return (
      <div>
        <TopNav />
        {this.props.children}
        <ToastContainer autoclose={false} />
      </div>
    );
  }
}
