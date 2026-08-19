import React, { useState } from 'react';
import { Button } from '../ui/button';

enum HELP_STEP {
  MENU,
  SIGNAL_EXPLANATION,
  SIGNAL_SETTLING,
  SIGNAL_CONTACT,
  SIGNAL_MOVEMENT,
  LEARN_BRAIN,
  LEARN_BLINK,
  LEARN_THOUGHTS,
  LEARN_ALPHA,
}

interface Props {
  handleClose: () => void;
}

// TODO: Refactor this into a more reusable Sidebar component that can be used in Collect, Clean, and Analyze screen
export function HelpSidebar(props: Props) {
  const [helpStep, setHelpStep] = useState(HELP_STEP.MENU);

  function handleStartSignal() {
    setHelpStep(HELP_STEP.SIGNAL_EXPLANATION);
  }

  function handleStartLearn() {
    setHelpStep(HELP_STEP.LEARN_BRAIN);
  }

  function handleNext() {
    if (
      helpStep === HELP_STEP.SIGNAL_MOVEMENT ||
      helpStep === HELP_STEP.LEARN_ALPHA
    ) {
      setHelpStep(HELP_STEP.MENU);
    } else {
      setHelpStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    setHelpStep((prev) => prev - 1);
  }

  function renderMenu() {
    return (
      <div className="flex flex-col">
        <h1 className="mb-4">What would you like to do?</h1>
        <div
          role="button"
          tabIndex={0}
          className="text-lg p-1 cursor-pointer hover:bg-gray-100"
          onClick={handleStartSignal}
          onKeyDown={(e) => e.key === 'Enter' && handleStartSignal()}
        >
          ★ Improve the signal quality of your sensors
        </div>
        <div
          role="button"
          tabIndex={0}
          className="text-lg p-1 cursor-pointer hover:bg-gray-100"
          onClick={handleStartLearn}
          onKeyDown={(e) => e.key === 'Enter' && handleStartLearn()}
        >
          ⚠ Learn about how the subjects movements create noise
        </div>
      </div>
    );
  }

  function renderHelp(header: string, content: string) {
    return (
      <>
        <div className="text-lg h-[80%]">
          <h1 className="mb-4">{header}</h1>
          {content}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="default"
            className="w-full"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </>
    );
  }

  function renderHelpContent() {
    switch (helpStep) {
      case HELP_STEP.SIGNAL_EXPLANATION:
        return renderHelp(
          'Improve the signal quality',
          'In order to collect quality data, you want to make sure that all electrodes have  a strong connection'
        );
      case HELP_STEP.SIGNAL_SETTLING:
        return renderHelp(
          'Tip #1: Good skin contact (and give it a minute)',
          "The sensors read best against clean, bare skin — sweep hair out from under them and wipe away any makeup or lotion. When you first put the headset on the signal often looks red and jumpy: that's normal while the sensors settle into contact. Sit still and it should calm down and turn green within a minute."
        );
      case HELP_STEP.SIGNAL_CONTACT:
        return renderHelp(
          'Tip #2: Ensure the sensors are making firm contact',
          'Re-seat the headset to make sure that all sensors contact the head with some tension. Take extra care to make sure the reference electrodes (the ones right behind the ears) make proper contact.  You may need to sweep hair out of the way to accomplish this'
        );
      case HELP_STEP.SIGNAL_MOVEMENT:
        return renderHelp(
          'Tip #3: Stay still',
          'To reduce noise during your experiment, ensure your subject is relaxed and has both feet on the floor. Sometimes, focusing on relaxing the jaw and the tongue can improve the EEG signal'
        );
      case HELP_STEP.LEARN_BRAIN:
        return renderHelp(
          'Your brain produces electricity',
          'Using the device that you are wearing, we can detect the electrical activity of your brain.'
        );
      case HELP_STEP.LEARN_BLINK:
        return renderHelp(
          'Try blinking your eyes',
          'Does the signal change? Eye movements create noise in the EEG signal'
        );
      case HELP_STEP.LEARN_THOUGHTS:
        return renderHelp(
          'Try thinking of a cat',
          "Does the signal change? Although EEG can measure overall brain activity, it's not capable of reading minds"
        );
      case HELP_STEP.LEARN_ALPHA:
        return renderHelp(
          'Try closing your eyes for 10 seconds',
          'You may notice a change in your signal due to an increase in alpha waves'
        );
      case HELP_STEP.MENU:
      default:
        return renderMenu();
    }
  }

  return (
    <div className="h-full p-4 bg-white border-l border-gray-200">
      <div className="flex justify-end">
        <button onClick={props.handleClose} aria-label="Close">
          ✕
        </button>
      </div>
      {renderHelpContent()}
    </div>
  );
}

export const HelpButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      className="h-11 w-11 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg"
      onClick={onClick}
      aria-label="Help"
    >
      ?
    </button>
  );
};