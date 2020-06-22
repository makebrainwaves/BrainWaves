
import React, { Component } from "react";
import { Grid, Button, Segment, Header, Image, Checkbox } from "semantic-ui-react";
import { isNil } from "lodash";
import styles from "../styles/common.css";
import { EXPERIMENTS, SCREENS } from "../../constants/constants";
import { readWorkspaces } from "../../utils/filesystem/storage";
import { MainTimeline, Trial, ExperimentParameters, ExperimentDescription } from "../../constants/interfaces";
import SecondaryNavComponent from "../SecondaryNavComponent";
import PreviewExperimentComponent from "../PreviewExperimentComponent";
import CustomDesign from "./CustomDesignComponent";
import PreviewButton from "../PreviewButtonComponent";

import facesHousesOverview from "../../assets/common/FacesHouses.png";
import stroopOverview from "../../assets/common/Stroop.png";
import multitaskingOverview from "../../assets/common/Multitasking.png";
import searchOverview from "../../assets/common/VisualSearch.png";
import customOverview from "../../assets/common/Custom.png";

// conditions images
import multiConditionShape from "../../assets/multi/multiConditionShape.png";
import multiConditionDots from "../../assets/multi/multiConditionDots.png";
import conditionFace from "../../assets/face_house/faces/Face1.jpg";
import conditionHouse from "../../assets/face_house/houses/House1.jpg";
import conditionOrangeT from "../../assets/search/conditionOrangeT.png";
import conditionNoOrangeT from "../../assets/search/conditionNoOrangeT.png";
import conditionCongruent from "../../assets/stroop/match_g.png";
import conditionIncongruent from "../../assets/stroop/mismatch6_r.png";

import { loadProtocol } from "../../utils/labjs/functions";
import { toast } from "react-toastify";
import InputModal from "../InputModal";

import { shell } from "electron";

const DESIGN_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL',
  PREVIEW: 'PREVIEW'
};

interface Props {
  history: Object;
  type: EXPERIMENTS;
  paradigm: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  mainTimeline: MainTimeline;
  trials: {
    [key: string]: Trial;
  };
  timelines: {};
  experimentActions: Object;
  description: ExperimentDescription;
  isEEGEnabled: boolean;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  isNewExperimentModalOpen: boolean;
  recentWorkspaces: Array<string>;
}

export default class Design extends Component<Props, State> {
  // handleStartExperiment: (Object) => void;

  // handleCustomizeExperiment: (Object) => void;
  // handlePreview: (Object) => void;
  // handleLoadCustomExperiment: (string) => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: DESIGN_STEPS.OVERVIEW,
      isPreviewing: false,
      isNewExperimentModalOpen: false,
      recentWorkspaces: []
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleCustomizeExperiment = this.handleCustomizeExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.endPreview = this.endPreview.bind(this);
    this.handleEEGEnabled = this.handleEEGEnabled.bind(this);
    if (isNil(props.params)) {
      props.experimentActions.loadDefaultTimeline();
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
      isNewExperimentModalOpen: true
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
    this.props.experimentActions.createNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM,
      paradigm: 'Custom'
      // paradigm: this.props.paradigm
    });
    this.props.experimentActions.saveWorkspace();
  }

  handlePreview(e) {
    e.target.blur();
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handleEEGEnabled(event: Object, data: Object) {
    this.props.experimentActions.setEEGEnabled(data.checked);
    this.props.experimentActions.saveWorkspace();
  }

  renderConditionIcon(type) {
    switch (type) {
      case 'conditionCongruent':
        return conditionCongruent;
        break;
      case 'conditionIncongruent':
        return conditionIncongruent;
        break;
      case 'conditionOrangeT':
        return conditionOrangeT;
        break;
      case 'conditionNoOrangeT':
        return conditionNoOrangeT;
        break;
      case 'conditionFace':
        return conditionFace;
        break;
      case 'conditionHouse':
        return conditionHouse;
        break;
      case 'multiConditionShape':
        return multiConditionShape;
        break;
      case 'multiConditionDots':default:
        return multiConditionDots;
        break;

    }
  }

  renderOverviewIcon(type) {
    switch (type) {
      case EXPERIMENTS.N170:
        return facesHousesOverview;
        break;

      case EXPERIMENTS.STROOP:
        return stroopOverview;
        break;

      case EXPERIMENTS.MULTI:
        return multitaskingOverview;
        break;

      case EXPERIMENTS.SEARCH:
        return searchOverview;
        break;

      case EXPERIMENTS.CUSTOM:default:
        return customOverview;
        break;

    }
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case DESIGN_STEPS.OVERVIEW:default:
        return <Grid stretched relaxed padded className={styles.contentGrid} style={{ alignItems: 'center' }}>
            <Grid.Row stretched>
              <Grid.Column stretched width={5}>
                <Segment basic>
                  <Image src={this.renderOverviewIcon(this.props.type)} />
                </Segment>
              </Grid.Column>

              <Grid.Column stretched width={11}>
                <Segment basic>
                  <Header as='h1'>{this.props.overview_title}</Header>
                  <p>{this.props.overview}</p>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>;

      case DESIGN_STEPS.BACKGROUND:
        return <Grid relaxed padded className={styles.contentGrid} style={{ alignItems: 'center' }}>
            <Grid.Row>
              <Grid.Column stretched width={4}>
                <Segment basic>
                  <Image src={this.renderOverviewIcon(this.props.type)} />
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
                    {this.props.background_links.map(link => <Button key={link.address} secondary onClick={() => {
                    shell.openExternal(link.address);
                  }}>
                        {link.name}
                      </Button>)}
                  </div>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>;

      case DESIGN_STEPS.PROTOCOL:
        return <Grid relaxed padded className={styles.contentGrid} style={{ alignItems: 'center' }}>
            <Grid.Row stretched>
              <Grid.Column stretched width={7} textAlign='left'>
                <Segment basic>
                  <Header as='h2'>{this.props.protocol_title}</Header>
                  <p>{this.props.protocol}</p>
                </Segment>
              </Grid.Column>

              <Grid.Column width={9}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={5}>
                      <Image src={this.renderConditionIcon(this.props.protocol_condition_first_img)} />
                    </Grid.Column>
                    <Grid.Column width={10}>
                      <Segment basic>
                        <Header as='h3'>{this.props.protocol_condition_first_title}</Header>
                        <p>{this.props.protocol_condition_first}</p>
                      </Segment>
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column width={5}>
                      <Image src={this.renderConditionIcon(this.props.protocol_condition_second_img)} />
                    </Grid.Column>
                    <Grid.Column width={10}>
                      <Segment basic>
                        <Header as='h3'>{this.props.protocol_condition_second_title}</Header>
                        <p>{this.props.protocol_condition_second}</p>
                      </Segment>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Grid.Column>
            </Grid.Row>
          </Grid>;

      case DESIGN_STEPS.PREVIEW:
        return <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column stretched width={12} textAlign='right' verticalAlign='middle' className={styles.previewWindow}>
              <PreviewExperimentComponent {...loadProtocol(this.props.paradigm)} isPreviewing={this.state.isPreviewing} onEnd={this.endPreview} type={this.props.type} paradigm={this.props.paradigm} />
            </Grid.Column>
            <Grid.Column width={4} verticalAlign='middle'>
              <PreviewButton isPreviewing={this.state.isPreviewing} onClick={e => this.handlePreview(e)} />
            </Grid.Column>
          </Grid>;

    }
  }

  render() {
    if (this.props.type === EXPERIMENTS.CUSTOM) {
      return <CustomDesign {...this.props} />;
    }
    return <div className={styles.mainContainer}>
        <SecondaryNavComponent title='Experiment Design' steps={DESIGN_STEPS} activeStep={this.state.activeStep} onStepClick={this.handleStepClick} onEditClick={this.handleCustomizeExperiment} enableEEGToggle={<Checkbox toggle defaultChecked={this.props.isEEGEnabled} onChange={(event, data) => this.handleEEGEnabled(event, data)} className={styles.EEGToggle} />} canEditExperiment={this.props.paradigm === 'Faces and Houses'} />
        {this.renderSectionContent()}
        <InputModal open={this.state.isNewExperimentModalOpen} onClose={this.handleLoadCustomExperiment} onExit={() => this.setState({ isNewExperimentModalOpen: false })} header='Enter a title for this experiment' />
      </div>;
  }
}