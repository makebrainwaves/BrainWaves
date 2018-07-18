// @flow
import * as React from "react";
import TopNavBar from "./TopNavBarContainer";

type Props = {
  children: React.Node
};

export default class App extends React.Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <TopNavBar />
        {this.props.children}
      </div>
    );
  }
}
