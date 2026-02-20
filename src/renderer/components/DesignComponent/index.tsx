import React, { Component } from 'react';
import { History } from 'history';
import {
  Grid,
  Button,
  Segment,
  Header,
  Image,
  Checkbox,
  CheckboxProps,
} from 'semantic-ui-react';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import styles from '../styles/common.module.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import { readWorkspaces } from '../../utils/filesystem/storage';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import CustomDesign from './CustomDesignComponent';
import PreviewButton from '../PreviewButtonComponent';

import facesHousesOverview from '../../experiments/faces_houses/icon.png';
import stroopOverview from '../../experiments/stroop/icon.png';
import multitaskingOverview from '../../experiments/multitasking/icon.png';
import searchOverview from '../../experiments/search/icon.png';
import customOverview from '../../experiments/custom/icon.png';

// conditions images
import multiConditionShape from '../../experiments/multitasking/stimuli/multiConditionShape.png';
import multiConditionDots from '../../experiments/multitasking/stimuli/multiConditionDots.png';
import conditionFace from '../../experiments/faces_houses/stimuli/faces/Face1.jpg';
import conditionHouse from '../../experiments/faces_houses/stimuli/houses/House1.jpg';
import conditionOrangeT from '../../experiments/search/stimuli/conditionOrangeT.png';
import conditionNoOrangeT from '../../experiments/search/stimuli/conditionNoOrangeT.png';
import conditionCongruent from '../../experiments/stroop/stimuli/match_g.png';
import conditionIncongruent from '../../experiments/stroop/stimuli/mismatch6_r.png';

import InputModal from '../InputModal';
import { ExperimentActions } from '../../actions';
import { getExperimentFromType } from '../../utils/labjs/functions';

const DESIGN_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL',
  PREVIEW: 'PREVIEW',
};

export interface DesignProps {
  history: History;
  type: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  experimentObject: ExperimentObject;
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  isNewExperimentModalOpen: boolean;
  recentWorkspaces: Array<string>;
}

export default class Design extends Component<DesignProps, State> {
  constructor(props: DesignProps) {
    super(props);
    this.state = {
      activeStep: DESIGN_STEPS.OVERVIEW,
      isPreviewing: false,
      isNewExperimentModalOpen: false,
      recentWorkspaces: [],
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleCustomizeExperiment = this.handleCustomizeExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(
      this
    );
    this.handlePreview = this.handlePreview.bind(this);
    this.endPreview = this.endPreview.bind(this);
    this.handleEEGEnabled = this.handleEEGEnabled.bind(this);
  }

  componentDidMount() {
    this.setState({ recentWorkspaces: readWorkspaces() });
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleStartExperiment() {
    this.props.history.push(SCREENS.COLLECT.route);
  }

  handleCustomizeExperiment() {
    this.setState({
      isNewExperimentModalOpen: true,
    });
  }

  handleLoadCustomExperiment(title: string) {
    this.setState({ isNewExperimentModalOpen: false });
    // Don't create new workspace if it already exists or title is too short
    if (this.state.recentWorkspaces.includes(title)) {
      toast.error(`Experiment already exists`);
      return;
    }
    if (title.length <= 3) {
      toast.error(`Experiment name is too short`);
      return;
    }
    this.props.ExperimentActions.CreateNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM,
    });
    this.props.ExperimentActions.SaveWorkspace();
  }

  handlePreview(e) {
    e.target.blur();
    this.setState((prevState) => ({
      isPreviewing: !prevState.isPreviewing,
    }));
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handleEEGEnabled(_, data: CheckboxProps) {
    if (data.checked === undefined) return;
    this.props.ExperimentActions.SetEEGEnabled(data.checked);
    this.props.ExperimentActions.SaveWorkspace();
  }

  static renderConditionIcon(condition) {
    switch (condition) {
      case 'conditionCongruent':
        return conditionCongruent;
      case 'conditionIncongruent':
        return conditionIncongruent;
      case 'conditionOrangeT':
        return conditionOrangeT;
      case 'conditionNoOrangeT':
        return conditionNoOrangeT;
      case 'conditionFace':
        return conditionFace;
      case 'conditionHouse':
        return conditionHouse;
      case 'multiConditionShape':
        return multiConditionShape;
      case 'multiConditionDots':
      default:
        return multiConditionDots;
    }
  }

  static renderOverviewIcon(type: EXPERIMENTS) {
    switch (type) {
      case EXPERIMENTS.N170:
        return facesHousesOverview;
      case EXPERIMENTS.STROOP:
        return stroopOverview;
      case EXPERIMENTS.MULTI:
        return multitaskingOverview;
      case EXPERIMENTS.SEARCH:
        return searchOverview;
      case EXPERIMENTS.CUSTOM:
      default:
        return customOverview;
    }
  }

  renderSectionContent() {
    const {
      text: { overview, protocol, background },
    } = getExperimentFromType(this.props.type);

    switch (this.state.activeStep) {
      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <Grid
            stretched
            relaxed
            padded
            className={styles.contentGrid}
            style={{ alignItems: 'center' }}
          >
            <Grid.Row stretched>
              <Grid.Column stretched width={5}>
                <Segment basic>
                  <Image src={Design.renderOverviewIcon(this.props.type)} />
                </Segment>
              </Grid.Column>

              <Grid.Column stretched width={11}>
                <Segment basic>
                  <Header as="h1">{overview.title}</Header>
                  <p>{overview.overview}</p>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        );

      case DESIGN_STEPS.BACKGROUND:
        return (
          <Grid
            relaxed
            padded
            className={styles.contentGrid}
            style={{ alignItems: 'center' }}
          >
            <Grid.Row>
              <Grid.Column stretched width={4}>
                <Segment basic>
                  <Image src={Design.renderOverviewIcon(this.props.type)} />
                </Segment>
              </Grid.Column>

              <Grid.Column stretched width={5}>
                <Segment basic>
                  <p>{background?.first_column_statement}</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {background?.first_column_question}
                  </p>
                </Segment>
              </Grid.Column>

              <Grid.Column stretched width={5}>
                <Segment basic>
                  <p>{background?.second_column_statement}</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {background?.second_column_question}
                  </p>
                </Segment>
              </Grid.Column>

              <Grid.Column width={2}>
                <Segment basic>
                  <div className={styles.externalLinks}>
                    {background?.links.map((link) => (
                      <Button
                        key={link.address}
                        secondary
                        onClick={() => {
                          window.open(link.address, '_blank');
                        }}
                      >
                        {link.name}
                      </Button>
                    ))}
                  </div>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        );

      case DESIGN_STEPS.PROTOCOL:
        return (
          <Grid
            relaxed
            padded
            className={styles.contentGrid}
            style={{ alignItems: 'center' }}
          >
            <Grid.Row stretched>
              <Grid.Column stretched width={7} textAlign="left">
                <Segment basic>
                  <Header as="h2">{protocol?.title}</Header>
                  <p>{protocol?.protocol}</p>
                </Segment>
              </Grid.Column>

              <Grid.Column width={9}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={5}>
                      <Image
                        src={Design.renderConditionIcon(
                          protocol?.condition_first_img
                        )}
                      />
                    </Grid.Column>
                    <Grid.Column width={10}>
                      <Segment basic>
                        <Header as="h3">
                          {protocol?.condition_first_title}
                        </Header>
                        <p>{protocol?.condition_first}</p>
                      </Segment>
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column width={5}>
                      <Image
                        src={Design.renderConditionIcon(
                          protocol?.condition_second_img
                        )}
                      />
                    </Grid.Column>
                    <Grid.Column width={10}>
                      <Segment basic>
                        <Header as="h3">
                          {protocol?.condition_second_title}
                        </Header>
                        <p>{protocol?.condition_second}</p>
                      </Segment>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        );

      case DESIGN_STEPS.PREVIEW:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={12}
              textAlign="right"
              verticalAlign="middle"
              className={styles.previewWindow}
            >
              <PreviewExperimentComponent
                title={this.props.title}
                params={this.props.params}
                experimentObject={this.props.experimentObject}
                isPreviewing={this.state.isPreviewing}
                onEnd={this.endPreview}
                type={this.props.type}
              />
            </Grid.Column>
            <Grid.Column width={4} verticalAlign="middle">
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={this.handlePreview}
              />
            </Grid.Column>
          </Grid>
        );
    }
  }

  render() {
    if (this.props.type === EXPERIMENTS.CUSTOM) {
      return <CustomDesign {...this.props} />;
    }
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title="Experiment Design"
          steps={DESIGN_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          enableEEGToggle={
            <Checkbox
              toggle
              defaultChecked={this.props.isEEGEnabled}
              onChange={this.handleEEGEnabled}
              className={styles.EEGToggle}
            />
          }
        />
        {this.renderSectionContent()}
        <InputModal
          open={this.state.isNewExperimentModalOpen}
          onClose={this.handleLoadCustomExperiment}
          onExit={() => this.setState({ isNewExperimentModalOpen: false })}
          header="Enter a title for this experiment"
        />
      </div>
    );
  }
}
