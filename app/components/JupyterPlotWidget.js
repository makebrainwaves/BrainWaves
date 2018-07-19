// @flow
import React, { Component } from "react";
import { Segment, Header } from "semantic-ui-react";
import { isNil } from "lodash";
import {
  richestMimetype,
  standardDisplayOrder,
  standardTransforms
} from "@nteract/transforms";

interface Props {
  plotMIMEBundle: ?{ [string]: string };
}

export default class JupyterPlotWidget extends Component<Props> {
  props: Props;
  state: State;

  renderResults() {
    if (!isNil(this.props.plotMIMEBundle)) {
      const mimeType = richestMimetype(
        this.props.plotMIMEBundle,
        standardDisplayOrder,
        standardTransforms
      );
      const Transform = standardTransforms[mimeType];
      return <Transform data={this.props.plotMIMEBundle[mimeType]} />;
    }
  }

  render() {
    return <Segment basic>{this.renderResults()}</Segment>;
  }
}
