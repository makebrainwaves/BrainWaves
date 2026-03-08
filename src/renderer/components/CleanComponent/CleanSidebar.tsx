import React, { Component } from 'react';
import styles from '../styles/common.module.css';

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
      <>
        <div className="flex flex-col gap-2">
          <h3 className={`text-lg font-bold ${styles.helpHeader}`}>
            What would you like to do?
          </h3>
          <button
            className="text-left p-4 hover:bg-gray-100 rounded transition-colors"
            onClick={this.handleStartSignal}
          >
            <div className={`p-4 ${styles.helpMenuItem}`}>
              ⭐ Improve the signal quality of your sensors
            </div>
          </button>
          <button
            className="text-left p-4 hover:bg-gray-100 rounded transition-colors"
            onClick={this.handleStartLearn}
          >
            <div className={`p-4 ${styles.helpMenuItem}`}>
              ⚠️ Learn about how the subjects movements create noise
            </div>
          </button>
        </div>
      </>
    );
  }

  renderHelp(header: string, content: string) {
    return (
      <>
        <div className={`p-4 ${styles.helpContent}`}>
          <h3 className={`text-lg font-bold ${styles.helpHeader}`}>
            {header}
          </h3>
          {content}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <button
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium w-full"
              onClick={this.handleBack}
            >
              Back
            </button>
          </div>
          <div className="flex-1">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium w-full"
              onClick={this.handleNext}
            >
              Next
            </button>
          </div>
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
      <div className={`p-4 ${styles.helpSidebar}`}>
        <button
          className="float-right bg-gray-200 text-gray-800 px-3 py-1 rounded-full hover:bg-gray-300 transition-colors font-medium"
          onClick={this.props.handleClose}
        >
          ✕
        </button>
        {this.renderHelpContent()}
      </div>
    );
  }
}
