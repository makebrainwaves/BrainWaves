import React, { Component, useMemo, useState } from 'react';
import { Grid, Header, Button, Segment } from 'semantic-ui-react';
import styles from '../styles/common.css';
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
          <Grid stretched relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={6}
              textAlign="right"
              verticalAlign="middle"
            >
              <Header as="h1">{experiment?.text.overview.title}</Header>
            </Grid.Column>
            <Grid.Column stretched width={6} verticalAlign="middle">
              <Segment as="p" basic>
                {experiment?.text.overview.overview}
              </Segment>
            </Grid.Column>
          </Grid>
        );
    }
  };

  return (
    <>
      <Button
        basic
        circular
        size="huge"
        floated="right"
        icon="x"
        className={styles.closeButton}
        onClick={onCloseOverview}
      />
      <SecondaryNavComponent
        title={type}
        steps={OVERVIEW_STEPS}
        activeStep={activeStep}
        onStepClick={handleStepClick}
        saveButton={
          <Button primary onClick={() => onStartExperiment(type)}>
            Start Experiment
          </Button>
        }
      />
      <div className={styles.homeContentContainer}>
        {renderSectionContent()}
      </div>
    </>
  );
};

// Generic curreid enum type guard
function isEnum<T>(en: T) {
  return (val: any): val is T[keyof T] => val in Object.values(en);
}

export default OverviewComponent;
