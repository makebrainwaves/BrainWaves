import React, { PureComponent } from 'react';
import { Button, Segment } from 'semantic-ui-react';

interface Props {
  isPreviewing: boolean;
  onClick: () => void;
}

export default class PreviewButton extends PureComponent<Props> {
  render() {
    if (!this.props.isPreviewing) {
      return (
        <Button secondary onClick={this.props.onClick}>
          Preview Experiment
        </Button>
      );
    }
    return (
      <Segment basic>
        <Button negative onClick={this.props.onClick}>
          Stop Preview
        </Button>
      </Segment>
    );
  }
}
