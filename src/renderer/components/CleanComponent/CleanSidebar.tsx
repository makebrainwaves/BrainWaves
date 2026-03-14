import React, { Component } from 'react';
import { Button } from '../ui/button';

enum HELP_STEP {
  MENU = 0,
  SIGNAL_EXPLANATION = 1,
  SIGNAL_SALINE = 2,
  SIGNAL_CONTACT = 3,
  SIGNAL_MOVEMENT = 4,
  LEARN_BRAIN = 5,
  LEARN_BLINK = 6,
  LEARN_THOUGHT = 7,
  LEARN_ALPHA = 8,
}

interface Props {
  handleClose: () => void;
}

interface State {
  helpStep: HELP_STEP;
}

export default class CleanSidebar extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      helpStep: HELP_STEP.MENU,
    };
    this.handleStartLearn = this.handleStartLearn.bind(this);
    this.handleStartSignal = this.handleStartSignal.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handleBack = this.handleBack.bind(this);
  }

  handleStartSignal() {
    this.setState({ helpStep: HELP_STEP.SIGNAL_EXPLANATION });
  }

  handleStartLearn() {
    this.setState({ helpStep: HELP_STEP.LEARN_BRAIN });
  }

  handleNext() {
    if (
      this.state.helpStep === HELP_STEP.SIGNAL_MOVEMENT ||
      this.state.helpStep === HELP_STEP.LEARN_ALPHA
    ) {
      this.setState({ helpStep: HELP_STEP.MENU });
    } else {
      this.setState({ helpStep: this.state.helpStep + 1 });
    }
  }

  handleBack() {
    this.setState({ helpStep: this.state.helpStep - 1 });
  }

  renderMenu() {
    return (
      <div className="flex flex-col">
        <h1 className="mb-4">What would you like to do?</h1>
        <div
          className="text-lg p-1 cursor-pointer hover:bg-gray-100"
          onClick={this.handleStartSignal}
        >
          ★ Improve the signal quality of your sensors
        </div>
        <div
          className="text-lg p-1 cursor-pointer hover:bg-gray-100"
          onClick={this.handleStartLearn}
        >
          ⚠ Learn about how the subjects movements create noise
        </div>
      </div>
    );
  }

  renderHelp(header: string, content: string) {
    return (
      <>
        <div className="text-lg h-[80%]">
          <h1 className="mb-4">{header}</h1>
          {content}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="w-full" onClick={this.handleBack}>
            Back
          </Button>
          <Button variant="default" className="w-full" onClick={this.handleNext}>
            Next
          </Button>
        </div>
      </>
    );
  }

  renderHelpContent() {
    switch (this.state.helpStep) {
      case HELP_STEP.SIGNAL_EXPLANATION:
        return this.renderHelp(
          'Improve the signal quality',
          'In order to collect quality data, you want to make sure that all electrodes have  a strong connection'
        );
      case HELP_STEP.SIGNAL_SALINE:
        return this.renderHelp(
          'Tip #1: Saturate the sensors in saline',
          'Make sure the sensors are thoroughly soaked with saline solution. They should be wet to the touch'
        );
      case HELP_STEP.SIGNAL_CONTACT:
        return this.renderHelp(
          'Tip #2: Ensure the sensors are making firm contact',
          'Re-seat the headset to make sure that all sensors contact the head with some tension. You may need to sweep hair out of the way to accomplish this'
        );
      case HELP_STEP.SIGNAL_MOVEMENT:
        return this.renderHelp(
          'Tip #3: Stay still',
          'To reduce noise during your experiment, ensure your subject is relaxed and has both feet on the floor. Sometimes, focusing on relaxing the jaw and the tongue can improve the EEG signal'
        );
      case HELP_STEP.LEARN_BRAIN:
        return this.renderHelp(
          'Your brain produces electricity',
          'Using the device that you are wearing, we can detect the electrical activity of your brain.'
        );
      case HELP_STEP.LEARN_BLINK:
        return this.renderHelp(
          'Try blinking your eyes',
          'Does the signal change? Eye movements create noise in the EEG signal'
        );
      case HELP_STEP.LEARN_THOUGHT:
        return this.renderHelp(
          'Try thinking of a cat',
          "Does the signal change? Although EEG can measure overall brain activity, it's not capable of reading minds"
        );
      case HELP_STEP.LEARN_ALPHA:
        return this.renderHelp(
          'Try closing your eyes for 10 seconds',
          'You may notice a change in your signal due to an increase in alpha waves'
        );
      case HELP_STEP.MENU:
      default:
        return this.renderMenu();
    }
  }

  render() {
    return (
      <div className="h-full p-4 bg-white border-l border-gray-200">
        <div className="flex justify-end">
          <button
            onClick={this.props.handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {this.renderHelpContent()}
      </div>
    );
  }
}
