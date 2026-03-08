import React, { PureComponent } from 'react';

interface Props {
  isPreviewing: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default class PreviewButton extends PureComponent<Props> {
  render() {
    if (!this.props.isPreviewing) {
      return (
        <button
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
          onClick={this.props.onClick}
        >
          Preview Experiment
        </button>
      );
    }
    return (
      <button
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors font-medium"
        onClick={this.props.onClick}
      >
        Stop Preview
      </button>
    );
  }
}
