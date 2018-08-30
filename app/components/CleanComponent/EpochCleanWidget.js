// @flow
import React, { Component } from "react";
import { Segment } from "semantic-ui-react";
import {
  richestMimetype,
  standardDisplayOrder,
  standardTransforms
} from "@nteract/transforms";

interface Props {
  plotMIMEBundle: ?{ [string]: string };
}

export default class EpochCleanWidget extends Component<Props> {
  props: Props;

  renderResults() {
    if (this.props.plotMIMEBundle) {
      const bundle: { [string]: string } = this.props.plotMIMEBundle;
      const mimeType = richestMimetype(
        bundle,
        standardDisplayOrder,
        standardTransforms
      );
      if (mimeType) {
        const mType: string = mimeType;
        // 'any' typing to get around lack of typing in transforms lib
        const Transform: any = standardTransforms[mType];
        return <Transform data={bundle[mType]} />;
      }
    }
  }

  render() {
    return <Segment basic>{this.renderResults()}</Segment>;
  }
}
