// @flow
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
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { isNil } from 'lodash';
import styles from './../styles/collect.css';
import { EXPERIMENTS, DEVICES, KERNEL_STATUS } from '../../constants/constants';
import { Kernel } from '../../constants/interfaces';
import { readWorkspaceRawEEGData } from '../../utils/filesystem/storage';
import CleanSidebar from './CleanSidebar';
import * as path from 'path';

interface Props {
  type: ?EXPERIMENTS;
  title: string;
  deviceType: DEVICES;
  mainChannel: ?any;
  kernel: ?Kernel;
  kernelStatus: KERNEL_STATUS;
  epochsInfo: ?Array<{ [string]: number | string }>;
  jupyterActions: Object;
  experimentActions: Object;
  subject: string;
  session: number;
}

interface State {
  subjects: Array<?string>;
  eegFilePaths: Array<?{
    key: string,
    text: string,
    value: { name: string, dir: string },
  }>;
  selectedSubject: string;
  selectedFilePaths: Array<?string>;
}

export default class Clean extends Component<Props, State> {
  props: Props;
  state: State;
  handleRecordingChange: (Object, Object) => void;
  handleLoadData: () => void;
  handleSubjectChange: (Object, Object) => void;
  icons: string[];

  constructor(props: Props) {
    super(props);
    this.state = {
      subjects: [],
      eegFilePaths: [{ key: '', text: '', value: '' }],
      selectedFilePaths: [],
      selectedSubject: props.subject,
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
      this.props.jupyterActions.launchKernel();
    }
    this.setState({
      subjects: workspaceRawData
        .map((filepath) => filepath.path.split(path.sep)[filepath.path.split(path.sep).length - 3])
        .reduce((acc, curr) => {
          if (acc.find((subject) => subject.key === curr)) {
            return acc;
          }
          return acc.concat({
            key: curr,
            text: curr,
            value: curr,
          });
        }, []),
      eegFilePaths: workspaceRawData.map((filepath) => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path,
      })),
    });
  }

  handleRecordingChange(event: Object, data: Object) {
    this.setState({ selectedFilePaths: data.value });
  }

  handleSubjectChange(event: Object, data: Object) {
    this.setState({ selectedSubject: data.value, selectedFilePaths: [] });
  }

  handleLoadData() {
    this.props.experimentActions.setSubject(this.state.selectedSubject);
    this.props.jupyterActions.loadEpochs(this.state.selectedFilePaths);
  }

  handleSidebarToggle() {
    this.setState({ isSidebarVisible: !this.state.isSidebarVisible });
  }

  renderEpochLabels() {
    if (!isNil(this.props.epochsInfo) && this.state.selectedFilePaths.length >= 1) {
      return (
        <Segment basic textAlign='left'>
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
    if (
      !isNil(this.props.epochsInfo) &&
      this.props.epochsInfo.find((infoObj) => infoObj.name === 'Drop Percentage').value >= 2
    ) {
      return (
        <Link to='/analyze'>
          <Button primary>Analyze Dataset</Button>
        </Link>
      );
    }
  }

  render() {
    return (
      <Sidebar.Pushable basic as={Segment} className={styles.preTestPushable}>
        <Sidebar width='wide' direction='right' as={Segment} visible={this.state.isSidebarVisible}>
          <CleanSidebar handleClose={this.handleSidebarToggle} />
        </Sidebar>
        <SidebarPusher>
          <Grid
            columns='equal'
            textAlign='center'
            verticalAlign='middle'
            className={styles.preTestContainer}
          >
            <Grid.Row columns='equal'>
              <Grid.Column>
                <Header as='h1' floated='left'>
                  Clean
                </Header>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={6}>
                <Segment basic textAlign='left' className={styles.infoSegment}>
                  <Header as='h1'>Select & Clean</Header>
                  <p>
                    Ready to clean some data? Select a subject and one or more EEG recordings, then
                    launch the editor
                  </p>
                  <Header as='h4'>Select Subject</Header>
                  <Dropdown
                    fluid
                    selection
                    closeOnChange
                    value={this.state.selectedSubject}
                    options={this.state.subjects}
                    onChange={this.handleSubjectChange}
                  />
                  <Header as='h4'>Select Recordings</Header>
                  <Dropdown
                    fluid
                    multiple
                    selection
                    closeOnChange
                    value={this.state.selectedFilePaths}
                    options={this.state.eegFilePaths.filter(
                      (filepath) =>
                        this.state.selectedSubject ===
                        filepath.value.split(path.sep)[filepath.value.split(path.sep).length - 3]
                    )}
                    onChange={this.handleRecordingChange}
                  />
                  <Divider hidden section />
                  <Grid textAlign='center' columns='equal'>
                    <Grid.Column>
                      <Button
                        secondary
                        disabled={this.props.kernelStatus !== KERNEL_STATUS.IDLE}
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
                        onClick={this.props.jupyterActions.cleanEpochs}
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
