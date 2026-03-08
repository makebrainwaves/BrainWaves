import React, { useMemo, useState } from 'react';
import styles from '../styles/common.module.css';
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

interface State {
  activeStep: OVERVIEW_STEPS;
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
  const experiment = useMemo(() => {
    return getExperimentFromType(type);
  }, [type]);

  const renderSectionContent = () => {
    switch (activeStep) {
      case OVERVIEW_STEPS.OVERVIEW:
      default:
        return (
          <div className={`grid grid-cols-12 gap-4 ${styles.contentGrid}`}>
            <div className="col-span-6 flex items-center justify-end">
              <h1 className="text-2xl font-bold">{experiment?.text.overview.title}</h1>
            </div>
            <div className="col-span-6 flex items-center">
              <p className="p-4">{experiment?.text.overview.overview}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <button
        className={`bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-200 float-right ${styles.closeButton}`}
        onClick={onCloseOverview}
      >
        ✕
      </button>
      <SecondaryNavComponent
        title={type}
        steps={OVERVIEW_STEPS}
        activeStep={activeStep}
        onStepClick={handleStepClick}
        saveButton={
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
            onClick={() => onStartExperiment(type)}
          >
            Start Experiment
          </button>
        }
      />
      <div className={styles.homeContentContainer}>
        {renderSectionContent()}
      </div>
    </>
  );
};

// Generic curried enum type guard
function isEnum<T extends object>(en: T) {
  return (val: any): val is T[keyof T] => val in Object.values(en);
}

export default OverviewComponent;
