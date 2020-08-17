import React, { Component } from 'react';
import { HashHistory } from 'history';
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
import { shell } from 'electron';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import { readWorkspaces } from '../../utils/filesystem/storage';
import {
  Trial,
  ExperimentParameters,
  ExperimentDescription,
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import CustomDesign from './CustomDesignComponent';
import PreviewButton from '../PreviewButtonComponent';

import facesHousesOverview from '../../assets/common/FacesHouses.png';
import stroopOverview from '../../assets/common/Stroop.png';
import multitaskingOverview from '../../assets/common/Multitasking.png';
import searchOverview from '../../assets/common/VisualSearch.png';
import customOverview from '../../assets/common/Custom.png';

// conditions images
import multiConditionShape from '../../assets/multi/multiConditionShape.png';
import multiConditionDots from '../../assets/multi/multiConditionDots.png';
import conditionFace from '../../assets/face_house/faces/Face1.jpg';
import conditionHouse from '../../assets/face_house/houses/House1.jpg';
import conditionOrangeT from '../../assets/search/conditionOrangeT.png';
import conditionNoOrangeT from '../../assets/search/conditionNoOrangeT.png';
import conditionCongruent from '../../assets/stroop/match_g.png';
import conditionIncongruent from '../../assets/stroop/mismatch6_r.png';

import { loadProtocol } from '../../utils/labjs/functions';
import InputModal from '../InputModal';
import { ExperimentActions } from '../../actions';

const DESIGN_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL',
  PREVIEW: 'PREVIEW',
};

export interface Props {
  history: HashHistory;
  type: EXPERIMENTS;
  paradigm: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  ExperimentActions: typeof ExperimentActions;
  description: ExperimentDescription;
  isEEGEnabled: boolean;
  overview: string;
  overview_title: string;
  // TODO: this is too many props and we should put them into a
  // redux structure at some point
  background_links: { address: string; name: string }[];
  background_first_column: string;
  background_first_column_question: string;

  background_second_column: string;
  background_second_column_question: string;

  protocol: string;
  protocol_title: string;

  protocol_condition_first_img: any;
  protocol_condition_first_title: string;
  protocol_condition_first: string;

  protocol_condition_second_img: any;
  protocol_condition_second_title: string;
  protocol_condition_second: string;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  isNewExperimentModalOpen: boolean;
  recentWorkspaces: Array<string>;
}

export default class Design extends Component<Props, State> {
  constructor(props: Props) {
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
    if (isNil(props.params)) {
      props.ExperimentActions.LoadDefaultTimeline();
    }
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
      paradigm: 'Custom',
      // paradigm: this.props.paradigm
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

  handleEEGEnabled(
    event: React.FormEvent<HTMLInputElement>,
    data: CheckboxProps
  ) {
    this.props.ExperimentActions.SetEEGEnabled(data.checked);
    this.props.ExperimentActions.SaveWorkspace();
  }

  static renderConditionIcon(type) {
    switch (type) {
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

  static renderOverviewIcon(type) {
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
                  <Header as="h1">{this.props.overview_title}</Header>
                  <p>{this.props.overview}</p>
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
                  <p>{this.props.background_first_column}</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {this.props.background_first_column_question}
                  </p>
                </Segment>
              </Grid.Column>

              <Grid.Column stretched width={5}>
                <Segment basic>
                  <p>{this.props.background_second_column}</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {this.props.background_second_column_question}
                  </p>
                </Segment>
              </Grid.Column>

              <Grid.Column width={2}>
                <Segment basic>
                  <div className={styles.externalLinks}>
                    {this.props.background_links.map((link) => (
                      <Button
                        key={link.address}
                        secondary
                        onClick={() => {
                          shell.openExternal(link.address);
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
                  <Header as="h2">{this.props.protocol_title}</Header>
                  <p>{this.props.protocol}</p>
                </Segment>
              </Grid.Column>

              <Grid.Column width={9}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={5}>
                      <Image
                        src={Design.renderConditionIcon(
                          this.props.protocol_condition_first_img
                        )}
                      />
                    </Grid.Column>
                    <Grid.Column width={10}>
                      <Segment basic>
                        <Header as="h3">
                          {this.props.protocol_condition_first_title}
                        </Header>
                        <p>{this.props.protocol_condition_first}</p>
                      </Segment>
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column width={5}>
                      <Image
                        src={Design.renderConditionIcon(
                          this.props.protocol_condition_second_img
                        )}
                      />
                    </Grid.Column>
                    <Grid.Column width={10}>
                      <Segment basic>
                        <Header as="h3">
                          {this.props.protocol_condition_second_title}
                        </Header>
                        <p>{this.props.protocol_condition_second}</p>
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
                {...loadProtocol(this.props.paradigm)}
                isPreviewing={this.state.isPreviewing}
                onEnd={this.endPreview}
                type={this.props.type}
                paradigm={this.props.paradigm}
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
