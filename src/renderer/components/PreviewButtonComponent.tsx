import React, { PureComponent } from 'react';
import { Button } from './ui/button';

interface Props {
  isPreviewing: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default class PreviewButton extends PureComponent<Props> {
  render() {
    if (!this.props.isPreviewing) {
      return (
        <Button variant="secondary" onClick={this.props.onClick}>
          Preview Experiment
        </Button>
      );
    }
    return (
      <Button variant="destructive" onClick={this.props.onClick}>
        Stop Preview
      </Button>
    );
  }
}
