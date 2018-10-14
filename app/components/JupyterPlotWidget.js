// @flow
import React, { Component } from "react";
import { Segment, Button } from "semantic-ui-react";
import {
  richestMimetype,
  standardDisplayOrder,
  standardTransforms
} from "@nteract/transforms";
import { isNil } from "lodash";
import { storeJupyterImage } from "../utils/filesystem/storage";

interface Props {
  title: string;
  imageTitle: string;
  plotMIMEBundle: ?{ [string]: string };
}

interface State {
  rawData: string;
  mimeType: string;
}

export default class JupyterPlotWidget extends Component<Props, State> {
  props: Props;
  state: State;
  constructor(props: Props) {
    super(props);
    this.state = {
      rawData: "",
      mimeType: ""
    };
    this.handleSave = this.handleSave.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.plotMIMEBundle !== prevProps.plotMIMEBundle &&
      !isNil(this.props.plotMIMEBundle)
    ) {
      const bundle: { [string]: string } = this.props.plotMIMEBundle;
      const mimeType = richestMimetype(
        bundle,
        standardDisplayOrder,
        standardTransforms
      );
      if (mimeType) {
        this.setState({ rawData: bundle[mimeType], mimeType });
      }
    }
  }

  handleSave() {
    const buf = Buffer.from(this.state.rawData, "base64");
    storeJupyterImage(this.props.title, this.props.imageTitle, buf);
  }

  renderResults() {
    if (this.state.rawData) {
      const Transform = standardTransforms[this.state.mimeType];
      return <Transform data={this.state.rawData} />;
    }
  }

  renderSaveButton() {
    if (this.state.rawData) {
      return (
        <Button primary size="tiny" onClick={this.handleSave}>
          Save Image
        </Button>
      );
    }
  }

  render() {
    return (
      <Segment basic>
        {this.renderResults()}
        {this.renderSaveButton()}
      </Segment>
    );
  }
}
