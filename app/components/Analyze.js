// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Icon,
  Step,
  Segment,
  Header,
  Dropdown,
  GridColumn
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./ExperimentDesign.css";
import { EXPERIMENTS } from "../constants/constants";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";
import { readEEGDataDir } from "../utils/filesystem/write";

interface Props {
  type: ?EXPERIMENTS;
  kernel: ?Kernel;
  mainChannel: ?any;
  epochsInfo: ?{ [string]: number };
  psdPlot: ?{ [string]: string };
  erpPlot: ?{ [string]: string };
  jupyterActions: Object;
}

interface State {
  isBusy: boolean;
  eegFilePaths: [?{ key: string, text: string, value: string }];
  selectedFilePaths: [?string];
}

export default class Analyze extends Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this.state = {
      isBusy: false,
      eegFilePaths: [],
      selectedFilePaths: []
    };
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.handleLoadData = this.handleLoadData.bind(this);
  }

  componentWillMount() {
    if (isNil(this.props.kernel)) {
      this.props.jupyterActions.launchKernel();
    }
    this.setState({
      eegFilePaths: readEEGDataDir(this.props.type).map(filepath => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath
      }))
    });
  }

  handleDropdownChange(e: Object, props: Object) {
    this.setState({ selectedFilePaths: props.value });
  }

  handleLoadData() {
    this.props.jupyterActions.loadEpochs(this.state.selectedFilePaths);
  }

  render() {
    return (
      <div className={styles.experimentContainer}>
        <Grid columns={3} relaxed padded>
          <Grid.Column>
            <Segment raised padded color="red">
              <Dropdown
                placeholder="Select Datasets"
                fluid
                multiple
                selection
                options={this.state.eegFilePaths}
                onChange={this.handleDropdownChange}
              />
              <Button onClick={this.handleLoadData}>Load Data</Button>
            </Segment>
          </Grid.Column>
          <Grid.Column>
            <Segment raised padded color="red">
              Average ERP
            </Segment>
          </Grid.Column>
          <Grid.Column>
            <Segment raised padded color="red">
              PSD
            </Segment>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
