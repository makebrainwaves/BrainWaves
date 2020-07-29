import React, { Component } from 'react';
import {
  Grid,
  Button,
  Icon,
  Segment,
  Header,
  Dropdown,
  Sidebar,
  SidebarPusher,
  Divider,
  DropdownProps,
  DropdownItemProps,
  SemanticICONS
} from 'semantic-ui-react';
import * as path from 'path';
import { Link } from 'react-router-dom';
import { isNil, isArray, isString } from 'lodash';
import styles from '../styles/collect.css';
import commonStyles from '../styles/common.css';
import { EXPERIMENTS, DEVICES, KERNEL_STATUS } from '../../constants/constants';
import { Kernel } from '../../constants/interfaces';
import { readWorkspaceRawEEGData } from '../../utils/filesystem/storage';
import CleanSidebar from './CleanSidebar';
import { JupyterActions, ExperimentActions } from '../../actions';

export interface Props {
  type?: EXPERIMENTS;
  title: string;
  deviceType: DEVICES;
  mainChannel?: any;
  kernel?: Kernel;
  kernelStatus: KERNEL_STATUS;
  epochsInfo: Array<{
    [key: string]: number | string;
  }>;
  JupyterActions: typeof JupyterActions;
  ExperimentActions: typeof ExperimentActions;
  subject: string;
  session: number;
}

interface State {
  subjects: Array<DropdownItemProps>;
  eegFilePaths: Array<DropdownItemProps>;
  selectedSubject: string;
  selectedFilePaths: Array<string>;
  isSidebarVisible: boolean;
}

export default class Clean extends Component<Props, State> {
  icons: SemanticICONS[];

  constructor(props: Props) {
    super(props);
    this.state = {
      subjects: [],
      eegFilePaths: [{ key: '', text: '', value: '' }],
      selectedFilePaths: [],
      selectedSubject: props.subject,
      isSidebarVisible: false
    };
    this.handleRecordingChange = this.handleRecordingChange.bind(this);
    this.handleLoadData = this.handleLoadData.bind(this);
    this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.icons =
      props.type === EXPERIMENTS.N170
        ? ['smile', 'home', 'x', 'book']
        : ['star', 'star outline', 'x', 'book'];
  }

  async componentDidMount() {
    const workspaceRawData = await readWorkspaceRawEEGData(this.props.title);
    if (this.props.kernelStatus === KERNEL_STATUS.OFFLINE) {
      this.props.JupyterActions.LaunchKernel();
    }
    this.setState({
      subjects: workspaceRawData
        .map(
          filepath =>
            filepath.path.split(path.sep)[
              filepath.path.split(path.sep).length - 3
            ]
        )
        .reduce((acc, curr) => {
          if (acc.find(subject => subject.key === curr)) {
            return acc;
          }
          return acc.concat({
            key: curr,
            text: curr,
            value: curr
          });
        }, []),
      eegFilePaths: workspaceRawData.map(filepath => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path
      }))
    });
  }

  handleRecordingChange(event: object, data: DropdownProps) {
    if (isArray(data.value)) {
      const filePaths = data.value.filter<string>(isString);
      this.setState({ selectedFilePaths: filePaths });
    }
  }

  handleSubjectChange(event: object, data: DropdownProps) {
    if (!isNil(data) && isString(data.value)) {
      this.setState({ selectedSubject: data.value, selectedFilePaths: [] });
    }
  }

  handleLoadData() {
    this.props.ExperimentActions.SetSubject(this.state.selectedSubject);
    this.props.JupyterActions.LoadEpochs(this.state.selectedFilePaths);
  }

  handleSidebarToggle() {
    this.setState({ isSidebarVisible: !this.state.isSidebarVisible });
  }

  renderEpochLabels() {
    if (
      !isNil(this.props.epochsInfo) &&
      this.state.selectedFilePaths.length >= 1
    ) {
      return (
        <Segment basic textAlign="left">
          {this.props.epochsInfo.map((infoObj, index) => (
            <Segment key={infoObj.name} basic>
              <Icon name={this.icons[index]} />
              {infoObj.name}
              <p>{infoObj.value}</p>
            </Segment>
          ))}
        </Segment>
      );
    }
    return <div />;
  }

  renderAnalyzeButton() {
    const { epochsInfo } = this.props;
    if (!isNil(epochsInfo)) {
      const drop = epochsInfo.find(
        infoObj => infoObj.name === 'Drop Percentage'
      )?.value;

      if (drop && drop >= 2) {
        return (
          <Link to="/analyze">
            <Button primary>Analyze Dataset</Button>
          </Link>
        );
      }
    }
    return <></>;
  }

  render() {
    return (
      <Sidebar.Pushable basic as={Segment} className={styles.preTestPushable}>
        <Sidebar
          width="wide"
          direction="right"
          as={Segment}
          visible={this.state.isSidebarVisible}
        >
          <CleanSidebar handleClose={this.handleSidebarToggle} />
        </Sidebar>
        <SidebarPusher>
          <Grid
            columns="equal"
            textAlign="center"
            verticalAlign="middle"
            className={styles.preTestContainer}
          >
            <Grid.Row columns="equal">
              <Grid.Column>
                <Header as="h1" floated="left">
                  Clean
                </Header>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={6}>
                <Segment
                  basic
                  textAlign="left"
                  className={commonStyles.infoSegment}
                >
                  <Header as="h1">Select & Clean</Header>
                  <p>
                    Ready to clean some data? Select a subject and one or more
                    EEG recordings, then launch the editor
                  </p>
                  <Header as="h4">Select Subject</Header>
                  <Dropdown
                    fluid
                    selection
                    closeOnChange
                    value={this.state.selectedSubject}
                    options={this.state.subjects}
                    onChange={this.handleSubjectChange}
                  />
                  <Header as="h4">Select Recordings</Header>
                  <Dropdown
                    fluid
                    multiple
                    selection
                    closeOnChange
                    value={this.state.selectedFilePaths}
                    options={this.state.eegFilePaths.filter(filepath => {
                      if (isString(filepath.value)) {
                        const subjectFromFilepath = filepath.value.split(
                          path.sep
                        )[filepath.value.split(path.sep).length - 3];
                        return (
                          this.state.selectedSubject === subjectFromFilepath
                        );
                      }
                      return false;
                    })}
                    onChange={this.handleRecordingChange}
                  />
                  <Divider hidden section />
                  <Grid textAlign="center" columns="equal">
                    <Grid.Column>
                      <Button
                        secondary
                        disabled={
                          this.props.kernelStatus !== KERNEL_STATUS.IDLE
                        }
                        loading={
                          this.props.kernelStatus === KERNEL_STATUS.STARTING ||
                          this.props.kernelStatus === KERNEL_STATUS.BUSY
                        }
                        onClick={this.handleLoadData}
                      >
                        Load Dataset
                      </Button>
                    </Grid.Column>
                    <Grid.Column>
                      <Button
                        primary
                        disabled={isNil(this.props.epochsInfo)}
                        onClick={this.props.JupyterActions.CleanEpochs()}
                      >
                        Clean Data
                      </Button>
                    </Grid.Column>
                  </Grid>
                </Segment>
              </Grid.Column>
              <Grid.Column width={4}>
                {this.renderEpochLabels()}
                {this.renderAnalyzeButton()}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </SidebarPusher>
      </Sidebar.Pushable>
    );
  }
}
