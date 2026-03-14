import React, { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { EXPERIMENTS } from '../../constants/constants';
import SecondaryNavComponent from '../SecondaryNavComponent';
import { getExperimentFromType } from '../../utils/labjs/functions';

enum OVERVIEW_STEPS {
  OVERVIEW = 'OVERVIEW',
}

interface Props {
  type: EXPERIMENTS;
  onStartExperiment: (experiment: EXPERIMENTS) => void;
  onCloseOverview: () => void;
}

// Generic curried enum type guard
function isEnum<T extends object>(en: T) {
  return (val: any): val is T[keyof T] => val in Object.values(en);
}

const OverviewComponent: React.FC<Props> = ({
  type,
  onStartExperiment,
  onCloseOverview,
}) => {
  const [activeStep, setActiveStep] = useState(OVERVIEW_STEPS.OVERVIEW);

  const handleStepClick = (step: string) => {
    if (isEnum(OVERVIEW_STEPS)(step)) {
      setActiveStep(step);
    }
  };

  const experiment = useMemo(() => getExperimentFromType(type), [type]);

  const renderSectionContent = () => {
    switch (activeStep) {
      case OVERVIEW_STEPS.OVERVIEW:
      default:
        return (
          <div className="flex items-center gap-8 h-[90%]">
            <div className="flex-1 text-right">
              <h1>{experiment?.text.overview.title}</h1>
            </div>
            <div className="flex-1">
              <p>{experiment?.text.overview.overview}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <button
        className="flex justify-end w-full border-none shadow-none"
        onClick={onCloseOverview}
        aria-label="Close"
      >
        ✕
      </button>
      <SecondaryNavComponent
        title={type}
        steps={OVERVIEW_STEPS}
        activeStep={activeStep}
        onStepClick={handleStepClick}
        saveButton={
          <Button variant="default" onClick={() => onStartExperiment(type)}>
            Start Experiment
          </Button>
        }
      />
      <div className="pt-5 h-full overflow-y-auto">
        {renderSectionContent()}
      </div>
    </>
  );
};

export default OverviewComponent;
