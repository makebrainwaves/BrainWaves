// @flow
import * as React from "react";
import TopNav from "./TopNavBarContainer";

type Props = {
  children: React.Node
};

export default class App extends React.Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <TopNav />
        {this.props.children}
      </div>
    );
  }
}
